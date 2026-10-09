import Hero from '../Hero';
import LandingSections from '../LandingSections';
import { useHeroSearch } from '../Hero/useHeroSearch';

const Landing = () => {
  const search = useHeroSearch();
  return <><Hero search={search} /><LandingSections /></>;
};

export default Landing;
