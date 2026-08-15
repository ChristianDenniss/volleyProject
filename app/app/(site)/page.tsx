import Link from "next/link";
import { getDb } from "@db";
import { articles } from "@server/services";
import { HomeVideo } from "@components/site/home-video";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Volleyball 4-2 - Official Roblox Volleyball League",
  description:
    "Join the official Roblox Volleyball League (RVL). Watch matches, track player stats, view team rankings, and stay updated with the latest volleyball news and events.",
};

export default async function HomePage() {
  const rows = await articles.list(getDb(), { approvedOnly: true });
  const sorted = [...rows].sort((a, b) => b.id - a.id);
  const featured = sorted[0] ?? null;
  const side = sorted.slice(1, 5);

  return (
    <div className="mx-auto box-border min-h-screen w-full max-w-[2400px] px-[2vw] py-4 text-[#222] max-md:p-2">
      <section className="mx-auto mb-16 mt-8 flex w-full max-w-[2400px] min-h-[400px] items-start gap-8 px-[2vw] max-lg:flex-col max-lg:items-stretch max-md:mb-8 max-md:mt-4">
        {featured ? (
          <Link
            href={`/articles/${featured.id}`}
            className="block w-full flex-2 text-inherit no-underline"
          >
            <article className="relative aspect-[17.5/9] min-h-[300px] w-full overflow-hidden rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-transform duration-300 hover:scale-[1.02] max-lg:aspect-video">
              <img
                src={featured.imageUrl}
                alt={featured.title}
                className="block size-full object-cover"
              />
              <div className="absolute bottom-0 w-full bg-linear-to-t from-black/75 to-transparent px-6 py-4 text-white max-md:px-4 max-md:py-3">
                <span className="mb-1 mr-2 inline-block rounded bg-brand-yellow px-2 py-0.5 text-xs font-semibold max-[480px]:px-1.5 max-[480px]:py-0.5 max-[480px]:text-[0.7rem]">
                  By {featured.authorName}
                </span>
                <span className="mb-1 inline-block rounded bg-brand-silver px-2 py-0.5 text-xs font-semibold max-[480px]:px-1.5 max-[480px]:py-0.5 max-[480px]:text-[0.7rem]">
                  {new Date(featured.createdAt).toLocaleDateString()}
                </span>
                <h2 className="mb-4 text-[2.5rem] font-bold max-lg:text-[2rem] max-md:mb-2 max-md:text-2xl max-[480px]:text-xl">
                  {featured.title}
                </h2>
                <p className="text-base font-medium max-md:text-[0.9rem]">{featured.summary}</p>
              </div>
            </article>
          </Link>
        ) : (
          <div className="relative aspect-[17.5/9] min-h-[300px] w-full flex-2 overflow-hidden rounded-lg bg-brand-surface shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
            <div className="absolute bottom-0 w-full px-6 py-4">
              <h2 className="mb-4 text-[2.5rem] font-bold max-md:text-2xl">
                No Featured Articles Yet
              </h2>
              <p className="text-base font-medium">
                Check back soon for the latest news and updates!
              </p>
            </div>
          </div>
        )}

        <aside className="box-border flex h-full w-full min-w-[280px] max-w-[400px] flex-1 flex-col items-stretch gap-4 border-l border-[#eee] pl-6 max-lg:min-w-0 max-lg:max-w-none max-lg:border-l-0 max-lg:border-t max-lg:pl-0 max-lg:pt-6 xl:min-w-[320px] xl:max-w-[450px] xl:pl-8">
          {side.length > 0 ? (
            side.map((article) => (
              <Link
                key={article.id}
                href={`/articles/${article.id}`}
                className="block flex-1 text-inherit no-underline"
              >
                <article className="box-border flex h-full min-h-[80px] w-full cursor-pointer items-center justify-between gap-4 rounded-lg bg-white p-3 shadow-[0_2px_6px_rgba(0,0,0,0.1)] transition-all duration-300 hover:scale-[1.02] hover:bg-[#f0f0f0] max-[480px]:min-h-0 max-[480px]:flex-col max-[480px]:items-start xl:p-4">
                  <h4 className="m-0 flex-1 text-[1.1rem] font-semibold leading-snug max-md:text-base max-[480px]:text-[0.9rem]">
                    {article.title}
                  </h4>
                  {article.imageUrl ? (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="h-[60px] w-[100px] shrink-0 rounded-md object-cover max-lg:h-[70px] max-[480px]:mt-2 max-[480px]:h-[150px] max-[480px]:w-full xl:h-[70px] xl:w-[110px]"
                    />
                  ) : null}
                </article>
              </Link>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">
              <p>No recent articles available.</p>
              <p>More content coming soon!</p>
            </div>
          )}
        </aside>
      </section>

      <HomeVideo videoId="jUYJKjPvPoQ" />

      <section className="relative -mb-4 ml-[calc(-50vw+50%)] h-[500px] min-h-[500px] w-screen overflow-hidden rounded-[10px] shadow-[0_3px_12px_rgba(0,0,0,0.1)] max-md:h-[300px] max-md:min-h-0 max-[480px]:h-[250px] min-[1600px]:h-[600px] min-[1600px]:min-h-[600px] min-[2000px]:h-[700px] min-[2000px]:min-h-[700px]">
        <img
          src="/images/callToAction.png"
          alt="Volleyball App Promo"
          className="absolute inset-0 z-1 size-full object-cover"
        />
        <a
          href="https://discord.gg/volleyball"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-5 top-5 z-2 cursor-pointer rounded-md border-none bg-brand-yellow px-6 py-2.5 text-[1.1rem] font-bold text-black no-underline transition-colors duration-300 hover:bg-brand-yellow-dark max-md:px-5 max-md:py-2 max-md:text-base max-[480px]:px-4 max-[480px]:py-1.5 max-[480px]:text-[0.9rem]"
        >
          Join RVL Today
        </a>
      </section>
    </div>
  );
}
