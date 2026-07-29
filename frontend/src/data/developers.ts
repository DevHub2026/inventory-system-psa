/**
 * Developer information for the "Meet the Development Team" page.
 * To add a new developer, push a new object into this array.
 */

export interface TeamMember {
  id: string
  name: string
  avatar?: string
}

/** Combined team introduction — one description for the whole team */
export const teamDescription =
  'This system was developed by three Computer Science students from Ramon Magsaysay Memorial Colleges, Inc. (RMMC) – College of Information Technology Education during their On-the-Job Training (OJT) at the Philippine Statistics Authority (PSA) Region XII. As part of their learning experience, they worked closely together to design and build a practical inventory management system that supports asset tracking, borrowing, maintenance scheduling, and inventory reporting. Through teamwork, continuous learning, and guidance from their mentors, they were able to create a solution that they hope will make everyday office processes more organized and efficient.'

export const teamMembers: TeamMember[] = [
  {
    id: 'marc',
    name: 'Marc Andrei B. Abregana',
    avatar: '/src/assets/marc-abregana.png',
  },
  {
    id: 'carl',
    name: 'Jay Carl M. Presbetero',
    avatar: '/src/assets/jaycarl-presbetero.jpg',
  },
  {
    id: 'eman',
    name: 'Eman Jayson B. Costan',
    avatar: '/src/assets/eman-costan.jpg',
  },
]

