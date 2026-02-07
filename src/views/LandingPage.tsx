import { Link } from 'react-router-dom';
import { Github, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Highlight {
  title: string;
  description: string;
}

interface FeatureBlock {
  title: string;
  items: string[];
}

const highlights: Highlight[] = [
  {
    title: 'Rich Journaling',
    description: 'Write detailed notes for every entry using Markdown for formatting, lists, and links.'
  },
  {
    title: 'Track & Analyze',
    description: 'Log your daily mood on a simple 5-point scale and use customizable tags to discover what influences your mind.'
  },
  {
    title: 'Privacy First',
    description: 'Your sensitive data is stored in a simple SQLite database file on your server. No third-party trackers or analytics.'
  }
];

const featureBlocks: FeatureBlock[] = [
  {
    title: 'Gamified Consistency',
    items: [
      'Stay consistent with built-in achievements',
      'Unlock badges as you build your journaling habit',
      'Track your journaling streak to stay motivated'
    ]
  },
  {
    title: 'Effortless Logging',
    items: [
      'Log your daily mood on a simple 5-point scale',
      'Use customizable tags like "Sleep" or "Productivity"',
      'Fast keyboard shortcuts to log moods in seconds'
    ]
  },
  {
    title: 'Insightful Analytics',
    items: [
      'View your mood history on a calendar heatmap',
      'See your average mood over time',
      'Discover patterns in your state of mind'
    ]
  }
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background pt-6 pb-16 lg:pb-32">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 mb-16">
          <Link className="flex items-center gap-2 group" to="/">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <img src="/logo.png" alt="Twilightio logo" width={32} height={32} className="w-8 h-8 object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight">Twilightio</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <Link to="/about" className="hover:text-primary transition-colors">About</Link>
          </div>

          <div className="flex items-center gap-4">
            <a href="https://github.com/shirsakm/twilightio" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <Github size={20} />
            </a>
            <Button asChild className="rounded-full shadow-lg shadow-primary/20">
              <Link to="/dashboard">
                Launch App <ArrowRight size={16} className="ml-2" />
              </Link>
            </Button>
          </div>
        </nav>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-primary transition-colors bg-background">
                Your data, your rules
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl">
                Privacy-first mood tracker and daily journal.
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Designed for effortless self-hosting. Your data, your server, your rules.
                No ads, no subscriptions, and absolutely no data mining.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Button size="lg" asChild className="rounded-full px-8 h-12 text-base">
                  <Link to="/dashboard">Get started for free</Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="rounded-full px-8 h-12 text-base">
                  <a href="https://github.com/shirsakm/twilightio">View on GitHub</a>
                </Button>
              </div>
            </div>

            <div className="flex-1 w-full max-w-md lg:max-w-full relative">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-primary/30 to-[color:var(--accent-bg)] blur-3xl rounded-full opacity-20 -z-10 animate-pulse" />
              <div className="bg-card border rounded-2xl shadow-2xl p-6 relative z-10">
                <div className="flex items-center justify-between mb-6 border-b pb-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tonight</span>
                  <span className="text-xs font-mono text-muted-foreground">10:36 PM</span>
                </div>

                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-[color:var(--accent-bg-soft)] text-[color:var(--accent-600)] flex items-center justify-center text-2xl shrink-0">
                    <span role="img" aria-label="moon">🌙</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Feeling grounded</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[color:var(--warning-soft)] text-[color:var(--warning)]">
                        🔥 2 day streak
                      </span>
                      <span>• Gratitude</span>
                    </p>
                  </div>
                </div>

                <p className="text-muted-foreground leading-relaxed text-sm mb-6 border-l-2 pl-4 italic">
                  "Wrapped up the day with a quiet walk. Noticed how the cool air reset my headspace and made the lingering worries feel smaller."
                </p>

                <div className="flex gap-2 justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="w-2 h-2 rounded-full bg-muted" />
                  <div className="w-2 h-2 rounded-full bg-muted" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
          <h2 className="text-3xl font-bold tracking-tight mb-16">Designed for mindful nights and focused mornings</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {highlights.map((item) => (
              <div key={item.title} className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-4">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-16">Everything you need to capture your story</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {featureBlocks.map((block) => (
              <div key={block.title} className="space-y-6">
                <h3 className="text-xl font-bold border-b pb-2">{block.title}</h3>
                <ul className="space-y-4">
                  {block.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-muted-foreground">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Take the weight off your mind.</h2>
          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
            Get up and running in minutes with a single Docker command. Self-host with confidence.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="rounded-full px-8 h-12 text-base text-primary">
              <Link to="/dashboard">Open the app</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-full px-8 h-12 text-base bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10 text-primary-foreground">
              <a href="https://github.com/shirsakm/twilightio" target="_blank" rel="noreferrer">View on GitHub</a>
            </Button>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t bg-muted/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-muted-foreground">© 2025 Twilightio. Open source and privacy-first.</p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <a href="mailto:hello@twilightio.com" className="hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
