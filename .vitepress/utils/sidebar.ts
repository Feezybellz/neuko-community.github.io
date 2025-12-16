import fs from 'fs'

export interface SidebarItem {
  text: string
  link?: string
  items?: SidebarItem[]
}

export function parseSummary(summaryPath: string): SidebarItem[] {
  if (!fs.existsSync(summaryPath)) return []

  const content = fs.readFileSync(summaryPath, 'utf-8')
  const lines = content.split('\n')

  const sidebar: SidebarItem[] = []
  let currentSection: SidebarItem | null = null

  for (const line of lines) {
    const linkMatch = line.match(/^[-*] \[(.*?)\]\((.*?)\)/)
    const subLinkMatch = line.match(/^  [-*] \[(.*?)\]\((.*?)\)/)
    const headerMatch = line.match(/^## (.*)/)

    if (headerMatch) {
      // New section from H2
      currentSection = {
        text: headerMatch[1],
        items: []
      }
      sidebar.push(currentSection)
    } else if (linkMatch) {
      // Top level link
      const item: SidebarItem = {
        text: linkMatch[1],
        link: linkMatch[2].replace('.md', '')
      }

      if (currentSection) {
        currentSection.items!.push(item)
      } else {
        if (item.link !== 'README') {
          sidebar.push(item)
        }
      }
    } else if (subLinkMatch) {
      // Indented item
      if (currentSection && currentSection.items && currentSection.items.length > 0) {
        const parentItem = currentSection.items[currentSection.items.length - 1]
        if (!parentItem.items) parentItem.items = []
        parentItem.items.push({
          text: subLinkMatch[1],
          link: subLinkMatch[2].replace('.md', '')
        })
      }
    }
  }
  return sidebar
}
