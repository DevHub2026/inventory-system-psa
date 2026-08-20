# Deployment documentation

This folder contains deployment guides and operational checklists for the PSA Inventory System.

Which deployment option should I use?

| Situation                      | Recommended Option          |
| ------------------------------ | --------------------------- |
| Developing locally             | Localhost                   |
| Testing features               | Localhost                   |
| Demo on one machine            | Localhost                   |
| Internal temporary test        | Localhost or private server |
| Real organizational deployment | Online/Production           |
| Multiple authorized users      | Online/Production           |

Quick links

- Localhost deployment guide: ./localhost-deployment.md
- Online/production deployment guide: ./online-deployment.md
- Environment variables: ./environment-variables.md
- Production checklist: ./production-checklist.md
- Backup & recovery: ./backup-and-recovery.md
- Troubleshooting: ./troubleshooting.md

Notes

- `/docs/old_docs/` contains legacy documentation kept for historical reference and should not be treated as the current source of truth.
- All commands and configuration are based on the current repository implementation (Laravel backend and React/Vite frontend). See the repo root and `backend/.env.example` for additional environment variables.
- Do not store secrets in source control. Use environment management or secret stores for production.
