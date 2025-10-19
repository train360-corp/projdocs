import { NavSection } from "@workspace/ui/components/nav-section";
import {
  IconDashboard,
  IconDatabase,
  IconDatabaseStar,
  IconFolderStar,
  IconListDetails,
  IconUsers
} from "@tabler/icons-react";

export const icons = [
  IconDashboard,
  IconUsers,
  IconListDetails,
  IconDatabase,
  IconDatabaseStar,
  IconFolderStar
]

export const sections: readonly NavSection[] = [
  {
    title: undefined,
    items: [
      {
        name: "Dashboard",
        icon: 0,
        url: "/dashboard"
      },
      {
        name: "Team",
        url: "/dashboard/team",
        icon: 1,
        isComingSoon: true
      },
      {
        name: "Lifecycle",
        url: "/dashboard/lifecycle",
        icon: 2,
        isComingSoon: true
      }
    ]
  },
  {
    title: "Documents",
    items: [
      {
        name: "Clients",
        url: "/dashboard/clients",
        icon: 3,
      },
      {
        name: "My Clients",
        url: "/dashboard/my-clients",
        icon: 4,
      },
      {
        name: "My Projects",
        url: "/dashboard/my-projects",
        icon: 5,
        isComingSoon: true
      },
    ]
  }
];