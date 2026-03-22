import HeroMapFade from "@/components/hero/HeroMapFade";
import HeroSplitPanel from "@/components/hero/HeroSplitPanel";
import HeroDiagonalSlice from "@/components/hero/HeroDiagonalSlice";
import HeroBoldTypography from "@/components/hero/HeroBoldTypography";
import HeroFloatingCards from "@/components/hero/HeroFloatingCards";
import HeroCircularAccent from "@/components/hero/HeroCircularAccent";
import HeroDarkImmersive from "@/components/hero/HeroDarkImmersive";

const variants = [
  { name: "1 — Map Fade", component: HeroMapFade },
  { name: "2 — Split Panel", component: HeroSplitPanel },
  { name: "3 — Diagonal Slice", component: HeroDiagonalSlice },
  { name: "4 — Bold Typography", component: HeroBoldTypography },
  { name: "5 — Floating Cards", component: HeroFloatingCards },
  { name: "6 — Circular Accent", component: HeroCircularAccent },
  { name: "7 — Dark Immersive", component: HeroDarkImmersive },
];

const HeroPreviewPage = () => {
  return (
    <div className="pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hero Variants Preview</h1>
        <p className="text-gray-500 mb-6">All 7 hero sections rendered below. Scroll through to compare.</p>
        <div className="flex flex-wrap gap-2 text-sm">
          {variants.map((v, i) => (
            <a
              key={i}
              href={`#variant-${i + 1}`}
              className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 transition-colors"
            >
              {v.name}
            </a>
          ))}
        </div>
      </div>

      {variants.map((v, i) => {
        const Component = v.component;
        return (
          <div key={i} id={`variant-${i + 1}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  #{i + 1}
                </span>
                <h2 className="text-xl font-semibold text-gray-900">{v.name}</h2>
              </div>
            </div>
            <div className="border-y border-gray-200">
              <Component />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HeroPreviewPage;
