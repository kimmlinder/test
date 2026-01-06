import { Link } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';

const socials = [
  { name: 'Db', href: 'https://dribbble.com/' },
  { name: 'Tx', href: 'https://twitter.com/' },
  { name: 'Be', href: 'https://behance.com/' },
  { name: 'Fb', href: 'https://facebook.com/' },
  { name: 'In', href: 'https://instagram.com/' },
];

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Back to Top */}
          <button
            onClick={scrollToTop}
            className="flex items-center gap-3 group font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-all">
              <ArrowUp className="h-4 w-4" />
            </span>
            <span>Back Top</span>
          </button>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link to="/track-order" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
              Track Order
            </Link>
            <p className="font-body text-sm text-muted-foreground">
              2025 ©{' '}
              <Link to="/" className="hover:text-foreground transition-colors">
                PixenCy
              </Link>
              . All rights reserved.
            </p>
          </div>

          {/* Socials */}
          <div className="flex items-center gap-2">
            <span className="font-body text-sm text-muted-foreground mr-4">Follow Us</span>
            {socials.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center font-body text-sm hover:bg-foreground hover:text-background hover:border-foreground transition-all"
              >
                {social.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
