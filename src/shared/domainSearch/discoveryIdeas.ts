import { sortDomainExtensions } from './query';

export type DomainDiscoveryCategory = `hot` | `trending` | `new`;

const weekMs = 7 * 24 * 60 * 60 * 1_000;
const mondayEpoch = Date.UTC(1970, 0, 5);

export const getDiscoveryWeek = (now = Date.now()) => Math.floor((now - mondayEpoch) / weekMs);
export const getNextDiscoveryWeekStart = (week: number) => mondayEpoch + (week + 1) * weekMs;

const ideas = {
  hot: {
    singleWords: [
      `aurelune`, `avelora`, `briovra`, `caelora`, `candelune`, `celavere`, `cielora`, `coravelle`, `delavri`, `elovra`,
      `embrelle`, `evandelle`, `fablette`, `fiorali`, `halation`, `havelune`, `heliograph`, `hinterland`, `isavera`, `jovelle`,
      `kelavere`, `lumerelle`, `lyraven`, `miradelle`, `murmuration`, `novalisse`, `opaline`, `orevella`, `palimpsest`, `peravelle`,
      `redolence`, `renavelle`, `serein`, `solavere`, `solstice`, `sycamore`, `terravelle`, `valevora`, `velorine`, `vesper`,
      `wayfarer`, `wisterine`, `zenavelle`,
    ],
    firstWords: [`amber`, `bright`, `cedar`, `cinder`, `cobalt`, `coral`, `fern`, `glow`, `golden`, `hazel`, `ivory`, `moss`, `opal`, `pearl`, `sable`, `velvet`],
    secondWords: [`arc`, `atlas`, `bloom`, `cove`, `crest`, `field`, `flint`, `forge`, `frame`, `glade`, `grove`, `harbor`, `haven`, `hollow`, `loom`, `meadow`, `mill`, `nest`, `nook`, `oasis`, `ridge`, `shard`, `spring`, `vale`],
  },
  trending: {
    singleWords: [
      `adjacency`, `algivra`, `bifurcate`, `bitavri`, `calibrune`, `coalesce`, `codivra`, `contravariant`, `datavri`, `deconvolve`,
      `diffracta`, `echovri`, `embeddra`, `fabriva`, `fluxari`, `graphari`, `isometric`, `iterative`, `kerneva`, `lexeme`,
      `lexivra`, `linkavri`, `logivra`, `luminode`, `meshrune`, `metriva`, `modulira`, `neuravri`, `orthogonal`, `paravolt`,
      `polymath`, `quantari`, `quaternion`, `registra`, `seqora`, `simulane`, `synthari`, `tessellum`, `transversal`, `vectrali`,
      `voltari`, `weavari`, `zylode`,
    ],
    firstWords: [`agent`, `build`, `canvas`, `circuit`, `code`, `creator`, `data`, `diagram`, `kernel`, `kit`, `maker`, `model`, `prompt`, `signal`, `vector`, `workflow`],
    secondWords: [`bank`, `beam`, `bridge`, `cache`, `dock`, `drop`, `field`, `foundry`, `frame`, `garden`, `grid`, `harbor`, `junction`, `lane`, `ledger`, `mesh`, `nest`, `orbit`, `patch`, `relay`, `route`, `scope`, `stack`, `trail`],
  },
  new: {
    singleWords: [
      `anfractuous`, `asterali`, `brinavere`, `brumous`, `cynosure`, `dovari`, `dunavera`, `effloresce`, `estavelle`, `fenavri`,
      `gloaming`, `havenali`, `heathari`, `interstice`, `islemere`, `junavri`, `knollari`, `lambent`, `lavelisse`, `lilavere`,
      `lunalisse`, `marivelle`, `merevora`, `mistfall`, `moravine`, `nivalis`, `obliquity`, `petrichor`, `quaravelle`, `ridgeline`,
      `riverali`, `salavere`, `sandalisse`, `soravella`, `susurrus`, `tessavere`, `tidavelle`, `umberali`, `verdigris`, `vernalisse`,
      `winavere`, `wrenali`, `yarrowali`,
    ],
    firstWords: [`bitter`, `copper`, `drift`, `early`, `fog`, `frost`, `lilac`, `lunar`, `maple`, `mint`, `morning`, `river`, `salt`, `silver`, `tidal`, `winter`],
    secondWords: [`beacon`, `branch`, `cabin`, `compass`, `crate`, `dune`, `fable`, `fold`, `folio`, `knoll`, `lantern`, `mosaic`, `orchard`, `parcel`, `path`, `pebble`, `pocket`, `postbox`, `quarry`, `ribbon`, `spindle`, `thicket`, `thread`, `way`],
  },
};

const categories: DomainDiscoveryCategory[] = [`hot`, `trending`, `new`];
const cycleIndex = (index: number, length: number) => ((index % length) + length) % length;

export const discoveryExtensions = sortDomainExtensions([`com`, `co`, `ai`, `app`, `dev`, `studio`]);

export const getDiscoveryCandidates = (week: number) => {
  const comSlots = 24;
  const otherSlots = 19;
  const singleWordInterval = 4;
  const singleWordSlots = Math.ceil(comSlots / singleWordInterval);

  return Array.from({ length: comSlots }, (_, slot) => discoveryExtensions.flatMap((extension, index) => {
    if (extension !== `com` && slot >= otherSlots) return [];
    const category = categories[(slot + index) % categories.length];
    const { firstWords, secondWords, singleWords } = ideas[category];
    if (slot % singleWordInterval === 0) {
      const word = singleWords[cycleIndex((week + index) * singleWordSlots + slot / singleWordInterval, singleWords.length)];
      return [{ category, domain: `${word}.${extension}`, wordCount: 1 }];
    }
    const combination = cycleIndex((week + index) * comSlots + slot, firstWords.length * secondWords.length);
    const first = firstWords[combination % firstWords.length];
    const second = secondWords[(Math.floor(combination / firstWords.length) + combination) % secondWords.length];
    return [{ category, domain: `${first}${second}.${extension}`, wordCount: 2 }];
  })).flat();
};
