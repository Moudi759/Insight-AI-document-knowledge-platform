import Link from "next/link";
import { Github, Twitter, Linkedin } from "lucide-react";
import { Logo } from "@/components/logo";

const FOOTER_LINKS = {
  Product: [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How it works" },
    { href: "#pricing", label: "Pricing" },
  ],
  Company: [
    { href: "/terms", label: "Terms of service" },
    { href: "/privacy", label: "Privacy policy" },
    { href: "/login", label: "Sign in" },
    { href: "/register", label: "Create account" },
  ],
};

const SOCIALS = [
  { href: "https://github.com", label: "GitHub", icon: Github },
  { href: "https://twitter.com", label: "Twitter", icon: Twitter },
  { href: "https://linkedin.com", label: "LinkedIn", icon: Linkedin },
];

export function Footer() {
  return (
    <footer className="border-t bg-sidebar/60">
      <div className="container py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Turn your documents into knowledge. An AI-powered workspace for
              reading, organizing and questioning everything you know.
            </p>
            <div className="mt-5 flex gap-1.5">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border bg-card text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <social.icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <nav key={group} aria-label={group}>
              <h3 className="text-sm font-semibold">{group}</h3>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Insight. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with Next.js, Prisma and PostgreSQL.
          </p>
        </div>
      </div>
    </footer>
  );
}
