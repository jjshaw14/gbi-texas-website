// Client review layer: the list of things we need the client to confirm.
//
// Each item is shown on its page as a marker (<button class="rv-flag" data-rv="ID"></button>)
// and in the Review panel. To add one: add an entry here, then drop a marker next to the
// content in the page. To remove the whole layer at launch, build with --production
// (see scripts/build-static.py); nothing in this file ships.
//
// endpoint: URL of feedback-server/feedback.php once it is deployed on a PHP host.
// While it is empty, "Send feedback" gives the client a summary to copy or download instead.
window.GBI_REVIEW = {
  endpoint: 'https://phpstack-163463-6797246.cloudwaysapps.com/gbi-review/feedback.php',
  items: [
    {
      id: 'sales-email', page: 'contact', where: 'Contact page',
      label: 'Sales email address',
      current: 'sales@gbiatx.com',
      q: 'Is this the right inbox for bid and project inquiries? It came from the copy deck and is unconfirmed.'
    },
    {
      id: 'careers-email', page: 'contact', where: 'Contact page',
      label: 'Careers email address',
      current: 'careers@gbiatx.com',
      q: 'Is this the right inbox for resumes and hiring questions? It came from the copy deck and is unconfirmed.'
    },
    {
      id: 'fax', page: 'contact', where: 'Contact page',
      label: 'Fax number',
      current: '(801) 543-1133',
      q: 'This number is on the current gbiatx.com but has a Utah area code. Keep it, change it, or remove it?'
    },
    {
      id: 'form-routing', page: 'contact', where: 'Contact page',
      label: 'Where form submissions go',
      current: 'Forms are not connected yet.',
      q: 'Who should receive Start a Project, Contact, and Employment submissions? Please list the address for each.'
    },
    {
      id: 'years-claim', page: 'index', where: 'Home page',
      label: '"More than 30 years" wording',
      current: '"We have built here for more than 30 years." The company itself was founded in 2015.',
      q: 'The 30+ years is the management team’s experience in Austin. Are you comfortable with the wording as written, or should it change?'
    },
    {
      id: 'first-year-projects', page: 'index', where: 'Home page',
      label: '"100+ projects in the first year"',
      current: 'More than 100 projects completed in the first year (2015).',
      q: 'Is this accurate, and are you comfortable publishing it?'
    },
    {
      id: 'headshots', page: 'about/leadership', where: 'Management Team and Sales pages',
      label: 'Team headshots',
      current: 'Placeholders reading “Photo Coming Soon” for Travis, Mike, Jacob, Riley, and Stephen.',
      q: 'Can you send headshots? Is anyone else who should be added to the team pages?'
    },
    {
      id: 'safety-networks', page: 'about/safety-quality', where: 'Safety & Quality page',
      label: 'ISNetworld and Browz badges',
      current: 'ISNetworld and Browz are shown as approved safety networks.',
      q: 'Is GBI Austin currently registered with both? Should any others be shown (Avetta, for example)?'
    },
    {
      id: 'apply-system', page: 'careers', where: 'Careers page',
      label: 'Job application link and text number',
      current: 'Team Engine apply link, and text “apply” to (435) 660-5841.',
      q: 'Is Team Engine still the right system, and is that text number still active?'
    },
    {
      id: 'tradeup-video', page: 'careers', where: 'Careers page',
      label: 'TradeUpTexas video',
      current: 'The PSA video from the current website, embedded from Vimeo.',
      q: 'Keep it on the new site? Is it still current?'
    },
    {
      id: 'other-offices', page: 'about/locations', where: 'Locations page',
      label: 'Other GBI offices',
      current: 'Lists the Austin office plus the Utah, New Mexico, and Wyoming locations from the current site.',
      q: 'Show all GBI locations, or only Austin?'
    },
    {
      id: 'lsi-category', page: 'projects/index', where: 'Projects page',
      label: 'Lone Star Imaging category',
      current: 'Appears under both Commercial Construction and Critical Facilities.',
      q: 'Which category should it be under, or both?'
    },
    {
      id: 'informatica-summit', page: 'projects/informatica', where: 'Informatica and Summit II pages',
      label: 'Informatica and Summit II sizes',
      current: 'Both are described with a 95,000 SF ground-up building; Informatica adds a 35,000 SF finish-out.',
      q: 'Is Informatica’s finish-out inside the Summit II building? Please confirm the sizes and how each should be described.'
    },
    {
      id: 'terms-legal', page: 'terms', where: 'Terms page',
      label: 'Terms & Conditions text',
      current: 'The corporate site’s terms: Utah governing law, Great Basin Industrial, LLC, Kaysville, UT.',
      q: 'Should the Austin site use this as-is, or does legal have an Austin or Texas version?'
    }
  ]
};
