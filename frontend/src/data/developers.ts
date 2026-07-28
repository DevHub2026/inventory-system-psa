/**
 * Developer information for the "Meet the Development Team" page.
 * To add a new developer, push a new object into this array.
 */

export interface Developer {
  id: string
  name: string
  role: string
  roleTags: string[]
  avatar?: string
  /** Short personal introduction paragraph */
  introduction: string
  modules: string[]
  /** Accent colour used for the card top-bar and avatar ring */
  accent: string
}

const developers: Developer[] = [
  {
    id: 'marc',
    name: 'Marc Andrei B. Abregana',
    role: 'Backend Developer',
    roleTags: [],
    avatar: '/src/assets/marc-abregana.png',
    accent: '#1E40AF',
    introduction:
      'A Computer Science student from Ramon Magsaysay Memorial Colleges, Inc. (RMMC) with a passion for programming and web development. During his On-the-Job Training (OJT) at the Philippine Statistics Authority (PSA) Region XII, he enjoyed building user-friendly features, learning from real-world projects, and working alongside his teammates to create a reliable and efficient inventory management system.',
    modules: [
      'Dashboard',
      'Assets',
      'Reservations',
      'Borrowings',
      'Inventory',
      'Maintenance',
      'Reports',
      'Notifications',
    ],
  },
  {
    id: 'carl',
    name: 'Jay Carl M. Presbetero',
    role: 'Frontend Developer',
    roleTags: [],
    avatar: '/src/assets/jaycarl-presbetero.jpg',
    accent: '#0E7490',
    introduction:
      'A Computer Science student from Ramon Magsaysay Memorial Colleges, Inc. (RMMC) who developed his programming skills during his On-the-Job Training (OJT) at the Philippine Statistics Authority (PSA) Region XII. He enjoys building responsive web applications, solving problems through code, and continuously learning new technologies to create better user experiences.',
    modules: [
      'Dashboard UI',
      'Asset UI',
      'Reservation UI',
      'Borrowing UI',
      'Inventory UI',
      'Maintenance UI',
      'Reports UI',
      'Shared Components',
    ],
  },
  {
    id: 'eman',
    name: 'Eman Jayson B. Costan',
    role: 'Full-Stack Developer',
    roleTags: [],
    avatar: '/src/assets/eman-costan.jpg',
    accent: '#6D28D9',
    introduction:
      'A Computer Science student from Ramon Magsaysay Memorial Colleges, Inc. (RMMC) with a passion for programming and web development. During his On-the-Job Training (OJT) at the Philippine Statistics Authority (PSA) Region XII, he enjoyed building user-friendly features and learning from real-world projects alongside his teammates to create a reliable and efficient inventory management system.',
    modules: [
      'Login',
      'Logout',
      'Profile',
      'Users',
      'Roles',
      'Permissions',
    ],
  },
]

export default developers
