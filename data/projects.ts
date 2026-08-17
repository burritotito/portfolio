export type Project = {
  id: string;
  slug: string;
  title: string;
  categories: string[];
  cover: string;
  description?: string;
  images?: string[];
};

export const projects: Project[] = [
  { id: '1', slug: 'champion-x-undercover', title: 'Champion x Undercover', categories: ['Art Direction'], cover: '/work/champion-x-undercover/01.jpg', description: 'Art direction for a Champion x Undercover collaboration, balancing archive-inspired grit with cleaner brand codes. [Placeholder copy — swap for your own words.]' },
  { id: '2', slug: 'starbucks', title: 'Starbucks', categories: ['Art Direction', 'Set Design'], cover: '/work/starbucks/01.jpg', description: 'Art direction and set design for a Starbucks campaign. [Placeholder copy — swap for your own words.]' },
  { id: '3', slug: 'uniqlo', title: 'Uniqlo', categories: ['Art Direction'], cover: '/work/uniqlo/01.jpg', description: 'Art direction for a Uniqlo campaign. [Placeholder copy — swap for your own words.]' },
//  { id: '4', slug: 'mukcyen', title: 'Mukcyen', categories: ['Art Direction'], cover: '/work/mukcyen/01.jpg' },
  { id: '5', slug: 'gabriel-grad', title: 'Gabriel Grad', categories: ['Art Direction'], cover: '/work/gabriel-grad/01.jpg', description: 'A collaborative art direction project with Gabriel Grad, developed across stills and motion. [Placeholder copy — swap for your own words.]' },
  { id: '6', slug: 'tekkons', title: 'Tekkons', categories: ['Art Direction'], cover: '/work/tekkons/01.jpg', description: 'Art direction for the Tekkons project. [Placeholder copy — swap for your own words.]' },
  { id: '7', slug: 'bella-poarch', title: 'Bella Poarch', categories: ['Art Direction', 'Graphic Design'], cover: '/work/bella-poarch/01.png', description: 'Art direction and graphic design work created for Bella Poarch. [Placeholder copy — swap for your own words.]' },
  { id: '8', slug: 'grollz', title: 'Grollz', categories: ['Art Direction'], cover: '/work/grollz/01.jpg', description: 'Art direction for the Grollz project, exploring bold color and character-driven visuals. [Placeholder copy — swap for your own words.]' },
  { id: '9', slug: 'one-or-eight-mv-shoot', title: 'One or Eight (MV & Shoot)', categories: ['Photography'], cover: '/work/one-or-eight-mv-shoot/01.jpg', description: 'Photography from the One or Eight music video shoot, captured on set across a single day. [Placeholder copy — swap for your own words.]' },
  { id: '10', slug: '12-buckle', title: '12 Buckle', categories: ['Photography'], cover: '/work/12-buckle/01.jpg', description: 'An editorial project shot for a friend, exploring quiet, unposed moments against a stripped-back rural backdrop. Shot over a single afternoon on 120 film, leaning into natural light and restraint rather than styling. [Placeholder copy — swap for your own words.]' },
  { id: '11', slug: 'ziva', title: 'ZIVA', categories: ['Photography'], cover: '/work/ziva/01.jpg', description: 'Photography for the ZIVA project. [Placeholder copy — swap for your own words.]' },
  { id: '12', slug: 'one-or-eight-x-kamiya', title: 'One or Eight x Kamiya', categories: ['Photography'], cover: '/work/one-or-eight-x-kamiya/01.jpg', description: 'A photography collaboration between One or Eight and Kamiya. [Placeholder copy — swap for your own words.]' },
  { id: '13', slug: 'zeeger-website', title: 'Zeeger Website', categories: ['Graphic Design'], cover: '/work/zeeger-website/01.png', description: 'Graphic design for the Zeeger website. [Placeholder copy — swap for your own words.]' },
//  { id: '14', slug: 'slawn-x-yachty', title: 'Slawn x Yachty', categories: ['Graphic Design'], cover: '/work/slawn-x-yachty/01.jpg' },
  { id: '15', slug: 'paranoia', title: 'Paranoia', categories: ['Graphic Design'], cover: '/work/paranoia/01.jpg', description: 'Graphic design work for the Paranoia project. [Placeholder copy — swap for your own words.]' },
  { id: '16', slug: 'sophie-book', title: 'Sophie Book', categories: ['Graphic Design'], cover: '/work/sophie-book/01.jpg', description: "Graphic design for Sophie's book. [Placeholder copy — swap for your own words.]" },
//  { id: '17', slug: 'wingstop', title: 'Wingstop', categories: ['Graphic Design'], cover: '/work/wingstop/01.jpg' },
  { id: '18', slug: 'euro', title: 'Euro', categories: ['Graphic Design'], cover: '/work/euro/01.png', description: 'Graphic design exploration built around the Euro theme. [Placeholder copy — swap for your own words.]' },
  { id: '19', slug: 'kaytranada', title: 'Kaytranada', categories: ['Set Design'], cover: '/work/kaytranada/01.jpg', description: 'Set design created for a Kaytranada project. [Placeholder copy — swap for your own words.]' },
  { id: '20', slug: 'team-rocket', title: 'Team Rocket', categories: ['Set Design'], cover: '/work/team-rocket/02.png', description: 'Set design for the Team Rocket project, including motion footage from set. [Placeholder copy — swap for your own words.]' },
//  { id: '21', slug: 'silk-road-music-video', title: 'Silk Road Music Video', categories: ['Set Design', 'Production Assist'], cover: '/work/silk-road-music-video/01.jpg' },
//  { id: '22', slug: 'project-crown', title: 'Project Crown', categories: ['Set Design'], cover: '/work/project-crown/01.jpg' },
  { id: '23', slug: 'mark-gong-alex-consani', title: 'Mark Gong / Alex Consani', categories: ['Production Assist'], cover: '/work/mark-gong-alex-consani/01.jpeg', description: 'Production assistance on a shoot with Mark Gong and Alex Consani. [Placeholder copy — swap for your own words.]' },
  { id: '24', slug: 'vogue-china-alex-consani', title: 'Vogue China / Alex Consani', categories: ['Production Assist'], cover: '/work/vogue-china-alex-consani/01.jpg', description: 'Production assistance for a Vogue China shoot with Alex Consani. [Placeholder copy — swap for your own words.]' },
  { id: '25', slug: 'ann-mukcyen-styling', title: 'Ann Mukcyen', categories: ['Production Assist'], cover: '/work/ann-mukcyen-styling/01.jpg', description: 'Production assistance for a styling project with Ann Mukcyen. [Placeholder copy — swap for your own words.]' },
//  { id: '26', slug: 'marshall-x-gliiico', title: 'Marshall x Gliiico', categories: ['Production Assist'], cover: '/work/marshall-x-gliiico/01.jpg' },
];