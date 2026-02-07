import { Link } from 'react-router-dom';
import { Github, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="relative bg-background border-b pt-6 pb-6">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link className="flex items-center gap-2 group" to="/">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <img src="/logo.png" alt="Twilightio logo" width={32} height={32} className="w-8 h-8 object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight">Twilightio</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link to="/#features" className="hover:text-primary transition-colors">Features</Link>
            <Link to="/about" className="text-primary font-semibold">About</Link>
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
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-3xl">
        <header className="text-center mb-16 animate-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">The Story of Twilightio</h1>
          <p className="text-xl text-muted-foreground">From a personal frustration to an award-winning open source project.</p>
        </header>

        <div className="space-y-16">
          <section className="prose max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-primary">
            <h2 className="text-2xl font-bold mb-4">How it Started</h2>
            <p className="text-muted-foreground leading-7 mb-4">
              I recently started keeping track of my daily moods and decided to start journaling alongside it.
              After some research, one of the most used apps for mood logging seemed to be Daylio, so I downloaded it.
              Turns out, it's truly a great app, and it's truly great at shilling its subscription.
            </p>
            <p className="text-muted-foreground leading-7 mb-4">
              I got annoyed, and decided I would just make a FOSS (Free and Open Source Software) alternative for my personal use instead.
              And here I am, presenting to you ✨ Twilightio ✨.
            </p>
            <p className="text-muted-foreground leading-7">
              My goal was simple: create a privacy-first, self-hosted mood tracker that doesn't lock features behind a paywall or sell your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Building in the Open</h2>
            <p className="text-muted-foreground leading-7 mb-6">
              I shared the initial project with the self-hosted community and received incredible feedback.
              Twilightio is designed from the ground up to be easily self-hosted.
            </p>
            <p className="text-muted-foreground leading-7 mb-4">Since the initial release, I've been hard at work:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Docker Support:</strong> The most requested feature is now live, allowing you to spin up an instance in minutes.</li>
              <li><strong>Desktop-First UI:</strong> Unlike mobile-only apps, Twilightio features a layout optimized for desktop use.</li>
              <li><strong>Dark Theme:</strong> Because every developer tool needs a dark mode.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Winning the GitHub Hackathon</h2>
            <div className="bg-[color:var(--warning-soft)] border border-[color:var(--warning)] p-4 rounded-lg mb-6">
              <p className="text-[color:var(--warning)] font-medium flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <strong>Update:</strong> We won the "For the Love of Code" hackathon hosted by GitHub!
              </p>
            </div>
            <p className="text-muted-foreground leading-7">
              Despite balancing this project with academics, Twilightio has continued to grow.
              We've added Google OAuth support for self-hosted users (making it easier to host on public-facing servers),
              implemented Daily Goals, and made significant quality-of-life improvements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Our Philosophy</h2>
            <p className="text-muted-foreground leading-7 mb-4">
              Twilightio is built for mindful teams and solo creators. It's a mood logger and journal that won't suck your data and soul.
              It is, and always will be, free and open source.
            </p>
            <p className="text-muted-foreground leading-7">
              If you find this project useful, please consider leaving a star on the <a href="https://github.com/shirsakm/twilightio" className="text-primary hover:underline font-medium">GitHub repo</a>—it really helps new users trust lesser-known projects.
            </p>
          </section>
        </div>
      </main>

      <footer className="py-12 border-t bg-muted/10 mt-24">
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

export default AboutPage;
