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
  {
    id: '1',
    slug: 'champion-x-undercover',
    title: 'Champion x Undercover',
    categories: ['Art Direction'],
    cover: '/work/champion-x-undercover/01.jpg',
    images: [
      '/work/champion-x-undercover/01.jpg',
      '/work/champion-x-undercover/02.jpg',
      '/work/champion-x-undercover/03.jpg',
      '/work/champion-x-undercover/04.jpg',
      '/work/champion-x-undercover/05.jpg',
      '/work/champion-x-undercover/06.jpg',
      '/work/champion-x-undercover/07.jpg',
      '/work/champion-x-undercover/08.jpg',
      '/work/champion-x-undercover/09.jpg',
    ],
  },
//  { id: '2', slug: 'starbucks', title: 'Starbucks', categories: ['Art Direction', 'Set Design'], cover: '/work/starbucks/01.jpg' },
//  { id: '3', slug: 'uniqlo', title: 'Uniqlo', categories: ['Art Direction'], cover: '/work/uniqlo/01.jpg' },
//  { id: '4', slug: 'mukcyen', title: 'Mukcyen', categories: ['Art Direction'], cover: '/work/mukcyen/01.jpg' },
  { id: '5', slug: 'gabriel-grad', title: 'Gabriel Grad', categories: ['Art Direction'], cover: '/work/gabriel-grad/01.jpg' },
//  { id: '6', slug: 'tekkons', title: 'Tekkons', categories: ['Art Direction'], cover: '/work/tekkons/01.jpg' },
  { id: '7', slug: 'bella-poarch', title: 'Bella Poarch', categories: ['Art Direction', 'Graphic Design'], cover: '/work/bella-poarch/01.png' },
  { id: '8', slug: 'grollz', title: 'Grollz', categories: ['Art Direction'], cover: '/work/grollz/01.jpg' },
  { id: '9', slug: 'one-or-eight-mv-shoot', title: 'One or Eight (MV & Shoot)', categories: ['Photography'], cover: '/work/one-or-eight-mv-shoot/01.jpg' },
  { id: '10', slug: '12-buckle', title: '12 Buckle', categories: ['Photography'], cover: '/work/12-buckle/01.jpg', description: 'An editorial project shot for a friend, exploring quiet, unposed moments against a stripped-back rural backdrop. Shot over a single afternoon on 120 film, leaning into natural light and restraint rather than styling. [Placeholder copy — swap for your own words.]', images: ['/work/12-buckle/01.jpg', '/work/12-buckle/02.jpg', '/work/12-buckle/03.jpg'] },
//  { id: '11', slug: 'ziva', title: 'ZIVA', categories: ['Photography'], cover: '/work/ziva/01.jpg' },
  { id: '12', slug: 'one-or-eight-x-kamiya', title: 'One or Eight x Kamiya', categories: ['Photography'], cover: '/work/one-or-eight-x-kamiya/01.jpg' },
//  { id: '13', slug: 'zeeger-website', title: 'Zeeger Website', categories: ['Graphic Design'], cover: '/work/zeeger-website/01.jpg' },
//  { id: '14', slug: 'slawn-x-yachty', title: 'Slawn x Yachty', categories: ['Graphic Design'], cover: '/work/slawn-x-yachty/01.jpg' },
//  { id: '15', slug: 'paranoia', title: 'Paranoia', categories: ['Graphic Design'], cover: '/work/paranoia/01.jpg' },
//  { id: '16', slug: 'sophie-book', title: 'Sophie Book', categories: ['Graphic Design'], cover: '/work/sophie-book/01.jpg' },
//  { id: '17', slug: 'wingstop', title: 'Wingstop', categories: ['Graphic Design'], cover: '/work/wingstop/01.jpg' },
  { id: '18', slug: 'euro', title: 'Euro', categories: ['Graphic Design'], cover: '/work/euro/01.png' },
  { id: '19', slug: 'kaytranada', title: 'Kaytranada', categories: ['Set Design'], cover: '/work/kaytranada/01.jpg' },
//  { id: '20', slug: 'team-rocket', title: 'Team Rocket', categories: ['Set Design'], cover: '/work/team-rocket/01.jpg' },
//  { id: '21', slug: 'silk-road-music-video', title: 'Silk Road Music Video', categories: ['Set Design', 'Production Assist'], cover: '/work/silk-road-music-video/01.jpg' },
//  { id: '22', slug: 'project-crown', title: 'Project Crown', categories: ['Set Design'], cover: '/work/project-crown/01.jpg' },
  { id: '23', slug: 'mark-gong-alex-consani', title: 'Mark Gong / Alex Consani', categories: ['Production Assist'], cover: '/work/mark-gong-alex-consani/01.jpeg' },
//  { id: '24', slug: 'vogue-china-alex-consani', title: 'Vogue China / Alex Consani', categories: ['Production Assist'], cover: '/work/vogue-china-alex-consani/01.jpg' },
  { id: '25', slug: 'ann-mukcyen-styling', title: 'Ann Mukcyen', categories: ['Production Assist'], cover: '/work/ann-mukcyen-styling/01.jpg' },
//  { id: '26', slug: 'marshall-x-gliiico', title: 'Marshall x Gliiico', categories: ['Production Assist'], cover: '/work/marshall-x-gliiico/01.jpg' },
];
