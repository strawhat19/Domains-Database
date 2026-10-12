export const blogImages: Record<string, number> = {
  'expired-domains-guide': require('../../../assets/blog/expired-domains-guide.svg'),
  'domain-extensions-guide': require('../../../assets/blog/domain-extensions-guide.svg'),
  'domain-name-valuation': require('../../../assets/blog/domain-name-valuation.svg'),
  'domain-name-security': require('../../../assets/blog/domain-name-security.svg'),
  'domain-portfolio-management': require('../../../assets/blog/domain-portfolio-management.svg'),
  'how-to-choose-a-domain-name': require('../../../assets/blog/how-to-choose-a-domain-name.svg'),
  'domain-vs-hosting-vs-website': require('../../../assets/blog/domain-vs-hosting-vs-website.svg'),
  'history-of-the-internet-and-domain-names': require('../../../assets/blog/history-of-the-internet-and-domain-names.svg'),
};

const switchedBlogImages: Record<string, number> = {
  'expired-domains-guide': require('../../../assets/blog/name-switch/expired-domains-guide.svg'),
  'domain-extensions-guide': require('../../../assets/blog/name-switch/domain-extensions-guide.svg'),
  'domain-name-valuation': require('../../../assets/blog/name-switch/domain-name-valuation.svg'),
  'domain-name-security': require('../../../assets/blog/name-switch/domain-name-security.svg'),
  'domain-portfolio-management': require('../../../assets/blog/name-switch/domain-portfolio-management.svg'),
  'how-to-choose-a-domain-name': require('../../../assets/blog/name-switch/how-to-choose-a-domain-name.svg'),
  'domain-vs-hosting-vs-website': require('../../../assets/blog/name-switch/domain-vs-hosting-vs-website.svg'),
  'history-of-the-internet-and-domain-names': require('../../../assets/blog/name-switch/history-of-the-internet-and-domain-names.svg'),
};

export const getBlogImage = (slug: string, switched = false) => (switched ? switchedBlogImages : blogImages)[slug];
