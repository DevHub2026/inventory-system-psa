const DATA_CODEWORDS = 34
const EC_CODEWORDS = 10
const QR_SIZE = 25
const FORMAT_BITS_L_MASK_0 = '111011111000100'

interface QrCodeProps {
  value: string
  size?: number
  className?: string
}

class BitBuffer {
  bits: number[] = []

  put(value: number, length: number) {
    for (let bit = length - 1; bit >= 0; bit--) {
      this.bits.push((value >>> bit) & 1)
    }
  }
}

function gfTables() {
  const exp = new Array<number>(512).fill(0)
  const log = new Array<number>(256).fill(0)
  let value = 1

  for (let index = 0; index < 255; index++) {
    exp[index] = value
    log[value] = index
    value <<= 1
    if (value & 0x100) value ^= 0x11d
  }

  for (let index = 255; index < 512; index++) exp[index] = exp[index - 255]

  return { exp, log }
}

const gf = gfTables()

function gfMultiply(left: number, right: number) {
  if (left === 0 || right === 0) return 0
  return gf.exp[gf.log[left] + gf.log[right]]
}

function generatorPolynomial(degree: number) {
  let polynomial = [1]

  for (let index = 0; index < degree; index++) {
    const next = new Array<number>(polynomial.length + 1).fill(0)
    for (let polyIndex = 0; polyIndex < polynomial.length; polyIndex++) {
      next[polyIndex] ^= polynomial[polyIndex]
      next[polyIndex + 1] ^= gfMultiply(polynomial[polyIndex], gf.exp[index])
    }
    polynomial = next
  }

  return polynomial
}

function reedSolomon(data: number[], degree: number) {
  const generator = generatorPolynomial(degree)
  const remainder = new Array<number>(degree).fill(0)

  for (const dataByte of data) {
    const factor = dataByte ^ remainder.shift()!
    remainder.push(0)

    for (let index = 0; index < degree; index++) {
      remainder[index] ^= gfMultiply(generator[index + 1], factor)
    }
  }

  return remainder
}

function dataCodewords(value: string) {
  const bytes = Array.from(new TextEncoder().encode(value))
  if (bytes.length > 32) {
    throw new Error('QR value is too long for the built-in asset QR renderer.')
  }

  const buffer = new BitBuffer()
  buffer.put(0b0100, 4)
  buffer.put(bytes.length, 8)
  bytes.forEach((byte) => buffer.put(byte, 8))

  const capacityBits = DATA_CODEWORDS * 8
  const terminatorLength = Math.min(4, capacityBits - buffer.bits.length)
  buffer.put(0, terminatorLength)
  while (buffer.bits.length % 8 !== 0) buffer.bits.push(0)

  const words: number[] = []
  for (let index = 0; index < buffer.bits.length; index += 8) {
    words.push(Number.parseInt(buffer.bits.slice(index, index + 8).join(''), 2))
  }

  let pad = 0xec
  while (words.length < DATA_CODEWORDS) {
    words.push(pad)
    pad = pad === 0xec ? 0x11 : 0xec
  }

  return words
}

function emptyMatrix() {
  return {
    modules: Array.from({ length: QR_SIZE }, () => new Array<boolean | null>(QR_SIZE).fill(null)),
    reserved: Array.from({ length: QR_SIZE }, () => new Array<boolean>(QR_SIZE).fill(false)),
  }
}

function setModule(
  modules: (boolean | null)[][],
  reserved: boolean[][],
  row: number,
  column: number,
  dark: boolean,
  isReserved = true,
) {
  if (row < 0 || column < 0 || row >= QR_SIZE || column >= QR_SIZE) return
  modules[row][column] = dark
  if (isReserved) reserved[row][column] = true
}

function addFinder(modules: (boolean | null)[][], reserved: boolean[][], row: number, column: number) {
  for (let y = -1; y <= 7; y++) {
    for (let x = -1; x <= 7; x++) {
      const targetRow = row + y
      const targetColumn = column + x
      const inFinder = x >= 0 && x <= 6 && y >= 0 && y <= 6
      const dark = inFinder && (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4))
      setModule(modules, reserved, targetRow, targetColumn, dark)
    }
  }
}

function addAlignment(modules: (boolean | null)[][], reserved: boolean[][], row: number, column: number) {
  for (let y = -2; y <= 2; y++) {
    for (let x = -2; x <= 2; x++) {
      const distance = Math.max(Math.abs(x), Math.abs(y))
      setModule(modules, reserved, row + y, column + x, distance !== 1)
    }
  }
}

function addFunctionalPatterns(modules: (boolean | null)[][], reserved: boolean[][]) {
  addFinder(modules, reserved, 0, 0)
  addFinder(modules, reserved, 0, QR_SIZE - 7)
  addFinder(modules, reserved, QR_SIZE - 7, 0)
  addAlignment(modules, reserved, 18, 18)

  for (let index = 8; index < QR_SIZE - 8; index++) {
    const dark = index % 2 === 0
    setModule(modules, reserved, 6, index, dark)
    setModule(modules, reserved, index, 6, dark)
  }

  setModule(modules, reserved, 17, 8, true)

  const formatPositions = [
    ...Array.from({ length: 9 }, (_, index) => [8, index] as const),
    ...Array.from({ length: 8 }, (_, index) => [index, 8] as const),
    ...Array.from({ length: 8 }, (_, index) => [QR_SIZE - 1 - index, 8] as const),
    ...Array.from({ length: 7 }, (_, index) => [8, QR_SIZE - 7 + index] as const),
  ]
  formatPositions.forEach(([row, column]) => {
    reserved[row][column] = true
    if (modules[row][column] === null) modules[row][column] = false
  })
}

function addData(modules: (boolean | null)[][], reserved: boolean[][], words: number[]) {
  const bits = words.flatMap((word) => Array.from({ length: 8 }, (_, index) => (word >>> (7 - index)) & 1))
  let bitIndex = 0
  let upward = true

  for (let column = QR_SIZE - 1; column > 0; column -= 2) {
    if (column === 6) column--

    for (let rowOffset = 0; rowOffset < QR_SIZE; rowOffset++) {
      const row = upward ? QR_SIZE - 1 - rowOffset : rowOffset

      for (let currentColumn = column; currentColumn >= column - 1; currentColumn--) {
        if (reserved[row][currentColumn]) continue

        const bit = bits[bitIndex++] === 1
        const masked = bit !== ((row + currentColumn) % 2 === 0)
        setModule(modules, reserved, row, currentColumn, masked, false)
      }
    }

    upward = !upward
  }
}

function addFormatBits(modules: (boolean | null)[][]) {
  const topLeft = [
    [8, 0],
    [8, 1],
    [8, 2],
    [8, 3],
    [8, 4],
    [8, 5],
    [8, 7],
    [8, 8],
    [7, 8],
    [5, 8],
    [4, 8],
    [3, 8],
    [2, 8],
    [1, 8],
    [0, 8],
  ]
  const other = [
    [QR_SIZE - 1, 8],
    [QR_SIZE - 2, 8],
    [QR_SIZE - 3, 8],
    [QR_SIZE - 4, 8],
    [QR_SIZE - 5, 8],
    [QR_SIZE - 6, 8],
    [QR_SIZE - 7, 8],
    [QR_SIZE - 8, 8],
    [8, QR_SIZE - 7],
    [8, QR_SIZE - 6],
    [8, QR_SIZE - 5],
    [8, QR_SIZE - 4],
    [8, QR_SIZE - 3],
    [8, QR_SIZE - 2],
    [8, QR_SIZE - 1],
  ]

  FORMAT_BITS_L_MASK_0.split('').forEach((bit, index) => {
    const dark = bit === '1'
    const [rowA, columnA] = topLeft[index]
    const [rowB, columnB] = other[index]
    modules[rowA][columnA] = dark
    modules[rowB][columnB] = dark
  })
}

function makeQrMatrix(value: string) {
  const data = dataCodewords(value)
  const words = [...data, ...reedSolomon(data, EC_CODEWORDS)]
  const { modules, reserved } = emptyMatrix()

  addFunctionalPatterns(modules, reserved)
  addData(modules, reserved, words)
  addFormatBits(modules)

  return modules.map((row) => row.map((module) => module === true))
}

export function QrCode({ value, size = 192, className }: QrCodeProps) {
  try {
    const modules = makeQrMatrix(value)
    const quietZone = 4
    const viewBoxSize = QR_SIZE + quietZone * 2

    return (
      <svg
        role="img"
        aria-label={`QR code for ${value}`}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        width={size}
        height={size}
        className={className}
      >
        <rect width={viewBoxSize} height={viewBoxSize} fill="white" />
        {modules.flatMap((row, rowIndex) =>
          row.map((dark, columnIndex) =>
            dark ? (
              <rect
                key={`${rowIndex}-${columnIndex}`}
                x={columnIndex + quietZone}
                y={rowIndex + quietZone}
                width="1"
                height="1"
                fill="currentColor"
              />
            ) : null,
          ),
        )}
      </svg>
    )
  } catch {
    return (
      <div className="flex h-48 w-48 items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-600">
        QR value is too long to render locally.
      </div>
    )
  }
}
