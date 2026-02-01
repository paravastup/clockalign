'use client';

import { motion } from 'framer-motion';
import { Clock, Github, Twitter, Linkedin, Mail, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="py-16 px-6 border-t border-border bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="md:col-span-2"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--purple))] flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-foreground">ClockAlign</span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md text-sm leading-relaxed">
              Schedule meetings that are fair for everyone. Built for global teams 
              who value their time and each other.
            </p>
            <div className="flex gap-2">
              <Button size="icon" variant="outline" className="rounded-full w-9 h-9">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" className="rounded-full w-9 h-9">
                <Linkedin className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" className="rounded-full w-9 h-9">
                <Github className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" className="rounded-full w-9 h-9">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>

          {/* Product */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h4 className="font-semibold mb-4 text-foreground">Product</h4>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#scheduler" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Scheduler
                </a>
              </li>
              <li>
                <a href="#leaderboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Sacrifice Score
                </a>
              </li>
              <li>
                <a href="#golden" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Golden Windows
                </a>
              </li>
              <li>
                <a href="#async" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Async Nudge
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Company */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h4 className="font-semibold mb-4 text-foreground">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms
                </Link>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="text-sm text-muted-foreground">
            © 2025 ClockAlign. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for global teams
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
