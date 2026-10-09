import type { BlogArticle } from './articles';

export const internetHistoryArticle: BlogArticle = {
  category: `History`,
  readMinutes: 7,
  publishedAt: `2026-10-09`,
  slug: `history-of-the-internet-and-domain-names`,
  title: `The History of the Internet and Domain Names`,
  image: `/images/blog/history-of-the-internet-and-domain-names.svg`,
  imageAlt: `Illustrated timeline connecting early network computers, the DNS naming tree, and a web browser, from ARPANET in 1969 to multilingual domain names`,
  imageCaption: `Networks, naming, and the Web developed in separate stages. Domain names connect that technical history with the addresses people use today.`,
  excerpt: `Follow the journey from ARPANET and TCP/IP to DNS, the first .com, the World Wide Web, and the names we use today.`,
  description: `Explore the history of the Internet and domain names: ARPANET in 1969, TCP/IP and DNS in 1983, Symbolics.com, CERN's Web, ICANN, and internationalized names.`,
  takeaway: `The Internet connects networks, DNS gives services readable names, and the Web uses that foundation. A useful domain keeps an address recognizable while its infrastructure changes.`,
  relatedSlugs: [`domain-vs-hosting-vs-website`, `domain-extensions-guide`, `domain-portfolio-management`],
  sections: [
    {
      id: `an-address-with-a-long-history`,
      title: `An everyday address with a long history`,
      paragraphs: [
        `Typing a domain into a browser feels like one action. Behind it sits a collection of ideas developed over decades: moving information between computers, connecting different networks, finding a service by name, and presenting linked pages. The familiar address is the visible edge of a much larger system.`,
        `That history helps explain today's practical choices. A domain, a hosting account, and a website have different jobs because they come from different layers of the system. You can change the computers serving a project while retaining its public name. To understand how that became possible, start before browsers, online stores, or the modern idea of a website.`,
      ],
    },
    {
      id: `arpanet-connects-four-hosts`,
      title: `1969: ARPANET connects an early research community`,
      paragraphs: [
        `The Internet Society's history, written by people involved in building the Internet, describes four computers connected to ARPANET by the end of 1969. The sites were UCLA, Stanford Research Institute, the University of California at Santa Barbara, and the University of Utah. The network grew from research into sharing computing resources and communicating through packets.`,
        `Packet switching divides information into smaller units for transmission instead of reserving an entire circuit for one conversation. ARPANET was an important predecessor of the Internet, but it was not yet the global collection of networks we use now. Its lasting contribution was a working environment where researchers could develop networking methods and discover useful applications.`,
      ],
    },
    {
      id: `tcp-ip-connects-networks`,
      title: `1983: TCP/IP gives different networks a common foundation`,
      paragraphs: [
        `An expanding network needed more than connections between a few computers. Independently operated networks had to exchange information using shared rules. TCP/IP became that foundation: IP handles addressing and packet delivery across networks, while TCP provides reliable, ordered delivery for applications that use it. Other applications can use different transport protocols over IP.`,
        `The Internet Society identifies January 1, 1983 as the ARPANET transition to TCP/IP. This milestone followed years of development rather than a single overnight invention. It helped establish the approach behind an Internet of interconnected networks, where participating networks could differ internally while still communicating with one another.`,
      ],
    },
    {
      id: `dns-replaces-a-growing-host-table`,
      title: `1983: DNS makes readable names work at scale`,
      paragraphs: [
        `Names existed before DNS. Early administrators maintained a shared host table connecting computer names with addresses. Paul Mockapetris's RFC 882, published in November 1983, explains that the table's size and frequent updates were becoming difficult to manage. Its proposed answer was a distributed naming database, with responsibility divided among administrators.`,
        `RFC 882 described the concepts; its companion, RFC 883, specified implementation details. Together they laid out the early Domain Name System. A hierarchy of labels lets responsibility be delegated, while name servers supply information and resolvers obtain answers. Instead of every computer keeping a complete directory, clients can discover the information they need.`,
        `DNS associates names with resource records, not just one permanent machine. That distinction matters: an address can support several services, and its underlying destinations can change. Naming becomes a stable reference for people while administrators maintain the technical information behind it.`,
      ],
    },
    {
      id: `symbolics-registers-the-first-com`,
      title: `1985: Symbolics.com marks the first .com registration`,
      paragraphs: [
        `ICANN's anniversary account dates the first second-level .com domain, symbolics.com, to March 15, 1985. This is a precise milestone: the first .com registration, rather than the invention of names or the first website. DNS was already being developed, and the Web still lay in the future.`,
        `That sequence is easy to overlook when domains seem inseparable from websites. A domain is part of the naming infrastructure. It can identify services without hosting a public home page. The early .com milestone belongs to the development of Internet addressing, before browsers made those names familiar to a much wider audience.`,
      ],
    },
    {
      id: `cern-builds-the-world-wide-web`,
      title: `1989–1993: The World Wide Web arrives on the Internet`,
      paragraphs: [
        `CERN records that Tim Berners-Lee invented the World Wide Web there in 1989 to help scientists share information. The first website described the Web project itself. On April 30, 1993, CERN placed the Web software in the public domain, helping others use and develop it.`,
        `The Web and the Internet are different. The Internet supplies the networking foundation; the Web is a system of linked resources accessed through browsers and web protocols. Email and other Internet services do not depend on visiting web pages. Browsers made online information easier to explore, and readable domain names became a convenient way to return to a particular site.`,
      ],
    },
    {
      id: `commercial-infrastructure-expands`,
      title: `The 1990s: Research infrastructure becomes everyday infrastructure`,
      paragraphs: [
        `The U.S. National Science Foundation describes NSFNET as a major research backbone that connected academic computing resources and encouraged broader networking. As commercial Internet services expanded, NSF retired its dedicated backbone in 1995. This was a transition in infrastructure, not a moment when the Internet stopped or suddenly began.`,
        `Broader access changed what a name could represent. An address could lead to a shop, publication, community, or service used outside the original research world. Registering a domain became part of establishing an online identity. Keeping that identity available also created ordinary responsibilities: maintaining accounts, renewing registrations, and documenting which services depended on the name.`,
      ],
    },
    {
      id: `icann-coordinates-unique-identifiers`,
      title: `1998: ICANN takes shape around coordination`,
      paragraphs: [
        `ICANN's articles of incorporation were filed on September 30, 1998. The nonprofit organization became part of the coordination framework for the Internet's unique identifiers, including the domain naming system. Its work involves technical coordination and policies developed through participation from different communities.`,
        `ICANN's own explanation emphasizes that it does not control Internet content. Coordination of names is different from running every website or owning every network. For domain holders, this distinction separates global naming arrangements from the registry operating an extension, the registrar handling a registration, and the providers delivering DNS, hosting, or email.`,
      ],
    },
    {
      id: `names-expand-in-language-and-purpose`,
      title: `2010 onward: More scripts and more kinds of names`,
      paragraphs: [
        `Internationalized domain names brought a wider range of writing systems into Internet naming. ICANN records the delegation of the first three Arabic-script country-code top-level domains on May 5, 2010, for Egypt, Saudi Arabia, and the United Arab Emirates. Russia's Cyrillic country-code domain followed on May 12. These were milestones for names written fully in those scripts, not the first appearance of multilingual website content.`,
        `ICANN's 2012 New gTLD Program also expanded the range of generic extensions, with its first delegations in October 2013. Today's naming landscape includes familiar suffixes, country-code choices, and names reflecting communities, places, or purposes. More choice does not remove the basic task: choose a complete address your audience can use and that you can maintain.`,
      ],
    },
    {
      id: `internet-and-domain-name-timeline`,
      title: `A timeline of the main milestones`,
      paragraphs: [`These dates describe different layers of progress. Networks came first, scalable naming followed, and the Web later made linked information familiar to a much larger audience.`],
      bullets: [
        `1969 — ARPANET connects four host computers by year's end.`,
        `January 1, 1983 — ARPANET transitions to TCP/IP.`,
        `November 1983 — RFC 882 and RFC 883 document early DNS.`,
        `March 15, 1985 — Symbolics.com becomes the first second-level .com.`,
        `1989 — Tim Berners-Lee invents the Web at CERN.`,
        `April 30, 1993 — CERN puts Web software in the public domain.`,
        `1995 — NSF retires its dedicated NSFNET backbone.`,
        `September 30, 1998 — ICANN's incorporation papers are filed.`,
        `May 2010 — The first IDN country-code TLDs are delegated.`,
        `October 2013 — The 2012 program's first new gTLDs are delegated.`,
      ],
    },
    {
      id: `why-this-history-matters-to-domain-owners`,
      title: `Why names still matter to a domain owner`,
      paragraphs: [
        `A useful name gives people something recognizable to type, share, and remember while the services behind it evolve. A fictional workshop can move its website to new hosting, change its email provider, and reorganize its pages without asking every customer to learn another domain. The continuity comes from maintaining the name and its configuration.`,
        `Treat that continuity as an ongoing responsibility. Record the registrar, renewal date, DNS provider, purpose, and accountable owner for each domain. Review dependencies before changing or retiring it. Domains Database can help organize that inventory; the relevant provider remains where actual registration and DNS actions occur. The historical lesson is practical: an address lasts because people keep the systems behind it working.`,
      ],
    },
  ],
  sources: [
    { label: `Internet Society: A Brief History of the Internet`, url: `https://www.internetsociety.org/internet/history-internet/brief-history-internet/` },
    { label: `Internet Society: The January 1, 1983 TCP/IP Transition`, url: `https://www.internetsociety.org/news/press-releases/2013/new-years-day-marks-30th-anniversary-of-major-milestone-for-global-internet/` },
    { label: `RFC 882: Domain Names — Concepts and Facilities (November 1983)`, url: `https://www.rfc-editor.org/rfc/rfc882.html` },
    { label: `RFC 883: Domain Names — Implementation and Specification (November 1983)`, url: `https://www.rfc-editor.org/rfc/rfc883.html` },
    { label: `ICANN: The First Dot Com Domain Name Turns 30`, url: `https://www.icann.org/en/blogs/details/celebrating-the-rise-of-the-modern-internet-the-first-dot-com-domain-name-turns-30-16-3-2015-en` },
    { label: `CERN: The Birth of the Web`, url: `https://home.cern/science/computing/the-birth-of-the-web/` },
    { label: `National Science Foundation: Birth of the Commercial Internet`, url: `https://www.nsf.gov/impacts/internet` },
    { label: `ICANN: Its September 30, 1998 Incorporation`, url: `https://www.icann.org/en/announcements/details/icann-10-years-old-today--a-decade-of-multi-stakeholder-decision-making-and-coordination-30-9-2008-en` },
    { label: `ICANN: What Does ICANN Do?`, url: `https://www.icann.org/resources/pages/what-2012-02-25-en` },
    { label: `ICANN: IDN ccTLDs — The First Four`, url: `https://www.icann.org/en/blogs/details/idn-cctlds--the-first-four-13-5-2010-en` },
    { label: `ICANN: About the New gTLD Program`, url: `https://newgtlds.icann.org/en/about/program` },
  ],
};
