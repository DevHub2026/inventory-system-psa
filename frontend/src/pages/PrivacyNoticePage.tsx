import {
  Shield,
  FileText,
  Lock,
  Users,
  Clock,
  Mail,
  Phone,
  CheckCircle2,
  HelpCircle,
  Building,
  KeyRound,
  FileCheck,
  Scale,
} from 'lucide-react'

export function PrivacyNoticePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1040, width: '100%', margin: '0 auto', paddingBottom: 36 }}>
      {/* ── Official Document Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0B3D91 0%, #1E3A8A 60%, #0F172A 100%)',
        borderRadius: 18,
        padding: '32px 36px',
        color: '#FFFFFF',
        boxShadow: '0 8px 24px rgba(11, 61, 145, 0.14)',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #1E40AF',
      }}>
        {/* Subtle glass reflection effect */}
        <div style={{
          position: 'absolute',
          right: -40,
          top: -40,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 70%)',
          pointerEvents: 'none',
        }} />

        {/* Header Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            backdropFilter: 'blur(8px)',
            borderRadius: 999,
            padding: '5px 14px',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            <Shield size={13} style={{ color: '#93C5FD' }} />
            <span style={{ color: '#FFFFFF' }}>Republic of the Philippines</span>
            <span style={{ color: '#93C5FD' }}>·</span>
            <span style={{ color: '#BFDBFE' }}>PSA Official Portal</span>
          </div>

          <span style={{
            fontSize: 12,
            fontWeight: 700,
            background: 'rgba(34, 197, 94, 0.2)',
            color: '#86EFAC',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            padding: '4px 12px',
            borderRadius: 999,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}>
            <CheckCircle2 size={13} style={{ color: '#86EFAC' }} />
            <span>RA 10173 Compliant</span>
          </span>

          <span style={{
            fontSize: 12,
            fontWeight: 700,
            background: 'rgba(255, 255, 255, 0.12)',
            color: '#E2E8F0',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '4px 12px',
            borderRadius: 999,
          }}>
            NPC Registered
          </span>
        </div>

        {/* Main Title */}
        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          margin: '0 0 10px 0',
          lineHeight: 1.25,
          color: '#FFFFFF',
        }}>
          Philippine Statistics Authority Data Privacy Notice
        </h1>

        <p style={{
          fontSize: 14.5,
          lineHeight: 1.7,
          color: '#E0E7FF',
          maxWidth: 840,
          margin: '0 0 22px 0',
        }}>
          This official Privacy Notice explains how the PSA Inventory & Asset Management System collects, protects, uses, and safeguards personal data in strict compliance with <strong style={{ color: '#FFFFFF' }}>Republic Act No. 10173</strong> (Data Privacy Act of 2012) and National Privacy Commission regulations.
        </p>

        {/* Metadata Strip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          fontSize: 12.5,
          color: '#BFDBFE',
          borderTop: '1px solid rgba(255, 255, 255, 0.16)',
          paddingTop: 16,
        }}>
          <div><strong>Effective Date:</strong> January 1, 2026</div>
          <div>•</div>
          <div><strong>Policy Version:</strong> 2.4 (Annual Review)</div>
          <div>•</div>
          <div><strong>Classification:</strong> Public / Official Notice</div>
          <div>•</div>
          <div><strong>Authority:</strong> Data Protection Office (DPO)</div>
        </div>
      </div>

      {/* ── Key Principles (4-Summary Cards) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: 14,
      }}>
        {/* Card 1: Necessary Collection */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #BFDBFE',
          borderTop: '4px solid #0B3D91',
          padding: '18px 20px',
          boxShadow: '0 2px 6px rgba(11, 61, 145, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: '#EFF6FF',
            color: '#0B3D91',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <FileText size={20} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0B3D91' }}>
              1. Proportional Collection
            </div>
            <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4, lineHeight: 1.5 }}>
              Only necessary employee identity, office assignment, and asset stewardship logs are gathered.
            </div>
          </div>
        </div>

        {/* Card 2: Lawful Mandate */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #FDE68A',
          borderTop: '4px solid #D97706',
          padding: '18px 20px',
          boxShadow: '0 2px 6px rgba(217, 119, 6, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: '#FFFBEB',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Scale size={20} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#B45309' }}>
              2. Lawful Mandate
            </div>
            <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4, lineHeight: 1.5 }}>
              Processing strictly supports government asset accountability and Commission on Audit standards.
            </div>
          </div>
        </div>

        {/* Card 3: Security & Encryption */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #FECACA',
          borderTop: '4px solid #DC2626',
          padding: '18px 20px',
          boxShadow: '0 2px 6px rgba(220, 38, 38, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: '#FEF2F2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Lock size={20} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#B91C1C' }}>
              3. Strict Safeguards
            </div>
            <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4, lineHeight: 1.5 }}>
              Credentials use salted Bcrypt hashing, TLS 1.3 transit encryption, and role-based permissions.
            </div>
          </div>
        </div>

        {/* Card 4: Employee Rights */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #BBF7D0',
          borderTop: '4px solid #16A34A',
          padding: '18px 20px',
          boxShadow: '0 2px 6px rgba(22, 163, 74, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: '#F0FDF4',
            color: '#16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#15803D' }}>
              4. Employee Rights
            </div>
            <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4, lineHeight: 1.5 }}>
              Full rights under RA 10173 to access, verify, rectify, and inspect personal information.
            </div>
          </div>
        </div>
      </div>

      {/* ── Detailed Policy Provisions (2x2 Grid) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 18,
      }}>
        {/* Section 1: Categories of Personal Data Collected */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 2px 6px rgba(15,23,42,0.03)',
        }}>
          <div style={{
            background: '#F8FAFC',
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            borderLeft: '4px solid #0B3D91',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#EFF6FF',
              color: '#0B3D91',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FileCheck size={17} />
            </div>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A' }}>
                Categories of Information Collected
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                Proportional data gathered solely for operational integrity
              </div>
            </div>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0B3D91', marginTop: 7, flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                <strong>Personal Identification:</strong> Employee Full Name, Government Employee Number (ID), Organizational Title, and Designated Office/Division.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0B3D91', marginTop: 7, flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                <strong>Account & Security Credentials:</strong> Official PSA Email Address, Generated System Username, Encrypted Passwords, and Role Privileges.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0B3D91', marginTop: 7, flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                <strong>Asset Accountability Logs:</strong> Property Acknowledgement Receipts (PAR), Inventory Custodian Slips (ICS), Borrow & Extension logs, and QR scan audit records.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0B3D91', marginTop: 7, flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                <strong>Technical Access Metadata:</strong> Client IP address, browser user-agent, operating system, and login session activity for forensic auditing.
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Lawful Purpose & Processing */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 2px 6px rgba(15,23,42,0.03)',
        }}>
          <div style={{
            background: '#F8FAFC',
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            borderLeft: '4px solid #D97706',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#FFFBEB',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Building size={17} />
            </div>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A' }}>
                Lawful Purpose & Processing
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                Defined statutory basis under Philippine law
              </div>
            </div>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D97706', marginTop: 7, flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                <strong>Statutory Custody Tracking:</strong> Fulfilling government stewardship requirements to monitor public funds, IT assets, office equipment, and vehicles.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D97706', marginTop: 7, flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                <strong>Workflow Approval & Issuances:</strong> Facilitating automated approval chains for borrowing, equipment reservations, maintenance, and asset transfers.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D97706', marginTop: 7, flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                <strong>COA Audit Verification:</strong> Generating certified property reports, inspection inventories, and unserviceable property disposal records.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D97706', marginTop: 7, flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                <strong>Security & Fraud Prevention:</strong> Detecting unauthorized system access, preventing duplicate logins, and maintaining tamper-evident audit logs.
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Technical Security Controls */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 2px 6px rgba(15,23,42,0.03)',
        }}>
          <div style={{
            background: '#F8FAFC',
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            borderLeft: '4px solid #DC2626',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#FEF2F2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Lock size={17} />
            </div>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A' }}>
                Technical & Organizational Safeguards
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                Enterprise security controls preserving confidentiality
              </div>
            </div>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626', marginTop: 7, flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                <strong>Strong Password Hashing:</strong> All system credentials are cryptographically protected using salted Bcrypt algorithms with zero plain-text storage.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626', marginTop: 7, flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                <strong>Role-Based Access Control (RBAC):</strong> Strict privilege boundaries ensure users can only view assets and workflows relevant to their authorized role.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626', marginTop: 7, flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                <strong>Transport Encryption:</strong> All web requests, mobile QR scans, and API transactions are encrypted in transit via TLS 1.3 / HTTPS.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626', marginTop: 7, flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                <strong>Automated Session Invalidation:</strong> Idle sessions time out automatically, and active tokens are securely revoked upon logout or password changes.
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Data Retention & Disposal */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 2px 6px rgba(15,23,42,0.03)',
        }}>
          <div style={{
            background: '#F8FAFC',
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            borderLeft: '4px solid #0B3D91',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#EFF6FF',
              color: '#0B3D91',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Clock size={17} />
            </div>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A' }}>
                Retention, Archiving & Disposal
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                Data lifecycle management and retention timelines
              </div>
            </div>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0B3D91', marginTop: 7, flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                <strong>Active Employment Duration:</strong> User records remain active during the employee's active service or designated contract period.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0B3D91', marginTop: 7, flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                <strong>Account Deactivation:</strong> Upon separation or transfer, user login credentials are deactivated immediately while maintaining historical property records.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0B3D91', marginTop: 7, flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                <strong>COA Record Retention:</strong> Signed property acknowledgements and transaction logs are preserved in accordance with National Archives of the Philippines guidelines.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0B3D91', marginTop: 7, flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                <strong>Secure Destruction:</strong> Decommissioned data records are permanently wiped using industry-standard digital sanitization methods.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Data Subject Rights & DPO Contact (2 Columns) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 18,
      }}>
        {/* Your Rights Under RA 10173 */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 2px 6px rgba(15,23,42,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: '#EFF6FF',
              color: '#0B3D91',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <KeyRound size={20} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                Your Rights as a Data Subject
              </div>
              <div style={{ fontSize: 12.5, color: '#64748B' }}>
                Guaranteed under Republic Act No. 10173
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} style={{ color: '#0B3D91', flexShrink: 0 }} />
              <span><strong>Right to be Informed:</strong> Know how personal data is collected and processed.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} style={{ color: '#0B3D91', flexShrink: 0 }} />
              <span><strong>Right of Access:</strong> Request a copy of personal information on file.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} style={{ color: '#0B3D91', flexShrink: 0 }} />
              <span><strong>Right to Rectification:</strong> Dispute and correct inaccurate or outdated records.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} style={{ color: '#0B3D91', flexShrink: 0 }} />
              <span><strong>Right to Object:</strong> Object to processing where no statutory basis exists.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} style={{ color: '#0B3D91', flexShrink: 0 }} />
              <span><strong>Right to Lodge Complaints:</strong> File concerns directly with the NPC.</span>
            </div>
          </div>
        </div>

        {/* Data Protection Officer (DPO) Channel */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 2px 6px rgba(15,23,42,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 16,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: '#FFFBEB',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Shield size={20} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  Data Protection Officer (DPO)
                </div>
                <div style={{ fontSize: 12.5, color: '#64748B' }}>
                  Official inquiries & privacy assistance
                </div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: '0 0 14px 0' }}>
              For inquiries regarding this notice, to exercise your data subject rights, or to submit a privacy concern, contact the designated PSA Data Protection Office:
            </p>

            <div style={{
              background: '#F8FAFC',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              fontSize: 13,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#0F172A' }}>
                <Mail size={15} style={{ color: '#0B3D91', flexShrink: 0 }} />
                <a href="mailto:dpo@psa.gov.ph" style={{ color: '#0B3D91', fontWeight: 700, textDecoration: 'none' }}>
                  dpo@psa.gov.ph
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#334155' }}>
                <Phone size={15} style={{ color: '#0B3D91', flexShrink: 0 }} />
                <span>Trunkline: +63 (2) 8938-5267 / Local DPO Desk</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#334155' }}>
                <Building size={15} style={{ color: '#0B3D91', flexShrink: 0 }} />
                <span>Philippine Statistics Authority · RSSO XII & Central Office</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Official Acknowledgment & Consent Strip ── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 14,
        border: '1px solid #CBD5E1',
        borderLeft: '5px solid #0B3D91',
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: '#EFF6FF',
          color: '#0B3D91',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <HelpCircle size={22} />
        </div>
        <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
          <strong style={{ color: '#0F172A' }}>Official User Acknowledgment:</strong> By accessing and utilizing the Philippine Statistics Authority Inventory Management System, you confirm that you have reviewed and understood this Privacy Notice and consent to the lawful processing of your official accountability records.
        </div>
      </div>
    </div>
  )
}
