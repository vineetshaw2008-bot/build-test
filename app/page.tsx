"use client";

import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Code2,
  Github,
  Linkedin,
  Mail,
  Rocket,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
} from "lucide-react";
import { FormEvent, useState } from "react";

type FormState = {
  name: string;
  email: string;
  message: string;
};

type FormErrors = Partial<FormState>;

const projects = [
  {
    title: "Revenue Operations Console",
    tag: "SaaS dashboard",
    result: "Cut weekly reporting work from 6 hours to 20 minutes.",
    accent: "bg-moss",
  },
  {
    title: "Clinical Intake Workflow",
    tag: "Secure product build",
    result: "Shipped audited role-based flows for a regulated service team.",
    accent: "bg-clay",
  },
  {
    title: "Marketplace Search Layer",
    tag: "Performance system",
    result: "Improved conversion by making search faster, clearer, and measurable.",
    accent: "bg-steel",
  },
];

const strengths = [
  "Next.js, React, TypeScript, Node.js",
  "Design systems, accessibility, responsive UI",
  "API contracts, data modeling, integrations",
  "Testing strategy, observability, release quality",
  "Product discovery, estimation, technical planning",
  "Refactoring legacy surfaces without stopping delivery",
];

const process = [
  {
    title: "Scope the outcome",
    text: "Clarify the job, users, risks, and the smallest credible release.",
  },
  {
    title: "Design the path",
    text: "Turn ambiguity into milestones, tradeoffs, interface contracts, and review points.",
  },
  {
    title: "Ship with proof",
    text: "Deliver working software with measured behavior, documentation, and clean handoff.",
  },
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(values: FormState) {
  const errors: FormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Name is required.";
  }

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!emailPattern.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.message.trim()) {
    errors.message = "Share a short note about the project.";
  }

  return errors;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="mt-2 text-sm font-medium text-clay">{message}</p>;
}

function ProjectMockup({
  accent,
  index,
}: {
  accent: string;
  index: number;
}) {
  return (
    <div className="mock-grid relative min-h-[230px] overflow-hidden rounded-lg border border-ink/10 bg-white shadow-soft">
      <div className="flex items-center gap-2 border-b border-ink/10 bg-ink px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-clay" />
        <span className="h-2.5 w-2.5 rounded-full bg-lemon" />
        <span className="h-2.5 w-2.5 rounded-full bg-moss" />
      </div>
      <div className="grid gap-4 p-4">
        <div className="grid grid-cols-[1fr_72px] gap-3">
          <div className="rounded-md border border-ink/10 bg-paper p-3">
            <div className="mb-3 h-2 w-24 rounded-full bg-ink/20" />
            <div className="h-10 rounded-md bg-ink" />
          </div>
          <div className={`${accent} rounded-md p-3 text-white`}>
            <div className="h-2 w-10 rounded-full bg-white/70" />
            <div className="mt-7 h-8 rounded bg-white/20" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((item) => (
            <div
              className="rounded-md border border-ink/10 bg-white p-3"
              key={item}
            >
              <div className="h-2 w-10 rounded-full bg-ink/15" />
              <div
                className={`mt-8 h-2 rounded-full ${
                  item === index % 3 ? accent : "bg-ink/20"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [values, setValues] = useState<FormState>({
    name: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function updateField(field: keyof FormState, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitted(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm(values);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setSubmitted(false);
      return;
    }

    setErrors({});
    setSubmitted(true);
    setValues({ name: "", email: "", message: "" });
  }

  return (
    <main className="min-h-screen overflow-hidden">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <a className="flex items-center gap-3" href="#top">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ink text-sm font-bold text-white">
              AM
            </span>
            <span className="hidden text-sm font-semibold sm:inline">
              Alex Morgan
            </span>
          </a>
          <div className="hidden items-center gap-6 text-sm font-medium text-ink/70 md:flex">
            <a className="transition hover:text-ink" href="#projects">
              Projects
            </a>
            <a className="transition hover:text-ink" href="#skills">
              Skills
            </a>
            <a className="transition hover:text-ink" href="#process">
              Process
            </a>
          </div>
          <a
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-moss"
            href="#contact"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            Contact
          </a>
        </nav>
      </header>

      <section
        className="section-anchor mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-14 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:pb-24 lg:pt-20"
        id="top"
      >
        <div className="flex flex-col justify-center">
          <p className="mb-5 inline-flex w-fit items-center gap-2 rounded-md border border-ink/10 bg-white px-3 py-2 text-sm font-semibold text-moss shadow-insetPanel">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Senior full-stack product engineer
          </p>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal text-ink sm:text-6xl lg:text-7xl">
            Reliable software for teams that need momentum, clarity, and craft.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/70">
            I partner with founders and product teams to shape, build, and
            improve web applications that have to work under real business
            pressure.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-clay px-5 text-base font-semibold text-white shadow-soft transition hover:bg-ink"
              href="#contact"
            >
              Start a project
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-ink/15 bg-white px-5 text-base font-semibold text-ink transition hover:border-ink/40"
              href="#projects"
            >
              View selected work
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3 text-sm sm:gap-4">
            {[
              ["12+", "years shipping"],
              ["40+", "launches led"],
              ["0-1", "and scale"],
            ].map(([value, label]) => (
              <div
                className="rounded-lg border border-ink/10 bg-white p-4 shadow-insetPanel"
                key={label}
              >
                <p className="text-2xl font-semibold text-ink">{value}</p>
                <p className="mt-1 leading-5 text-ink/60">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center">
          <div className="w-full rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
            <div className="rounded-md bg-ink p-4 text-white">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TerminalSquare className="h-5 w-5 text-lemon" />
                  <span className="text-sm font-semibold">Delivery board</span>
                </div>
                <span className="rounded bg-white/10 px-2 py-1 text-xs">
                  Live sprint
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {["Discovery", "Build", "Release"].map((stage, index) => (
                  <div className="rounded-md bg-white/8 p-3" key={stage}>
                    <p className="text-sm font-semibold">{stage}</p>
                    <div className="mt-4 space-y-2">
                      {[0, 1, 2].map((row) => (
                        <div
                          className={`h-10 rounded border border-white/10 ${
                            row === index ? "bg-lemon/80" : "bg-white/10"
                          }`}
                          key={row}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-[0.85fr_1fr]">
              <div className="rounded-md border border-ink/10 bg-paper p-4">
                <p className="text-sm font-semibold text-ink">Signal</p>
                <p className="mt-3 text-3xl font-semibold text-moss">98.7%</p>
                <p className="mt-2 text-sm leading-5 text-ink/60">
                  Release confidence from tests, logs, and product checks.
                </p>
              </div>
              <div className="rounded-md border border-ink/10 bg-paper p-4">
                <p className="text-sm font-semibold text-ink">
                  Current focus
                </p>
                <div className="mt-4 space-y-3">
                  {["Reduce onboarding drop-off", "Stabilize billing flows"].map(
                    (item) => (
                      <div className="flex items-center gap-3" key={item}>
                        <Check
                          className="h-4 w-4 shrink-0 text-moss"
                          aria-hidden="true"
                        />
                        <span className="text-sm text-ink/70">{item}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="section-anchor border-y border-ink/10 bg-white py-16 lg:py-20"
        id="projects"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">
                Selected projects
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold text-ink sm:text-4xl">
                Product surfaces designed to make complex work feel manageable.
              </h2>
            </div>
            <p className="max-w-md text-base leading-7 text-ink/65">
              These are representative examples with placeholder names and
              designed mockups. Swap them for real case studies when available.
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {projects.map((project, index) => (
              <article
                className="rounded-lg border border-ink/10 bg-paper p-4 shadow-insetPanel"
                key={project.title}
              >
                <ProjectMockup accent={project.accent} index={index} />
                <div className="pt-5">
                  <p className="text-sm font-semibold text-moss">
                    {project.tag}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-ink">
                    {project.title}
                  </h3>
                  <p className="mt-3 leading-7 text-ink/65">
                    {project.result}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="section-anchor mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-6 lg:grid-cols-[0.85fr_1fr] lg:px-8 lg:py-20"
        id="skills"
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-steel">
            Technical strengths
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">
            Senior engineering support without the hand-waving.
          </h2>
          <p className="mt-5 text-base leading-7 text-ink/65">
            I work across the product stack: user-facing workflows, service
            boundaries, release health, and the technical choices that help a
            team move faster after launch.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {strengths.map((strength) => (
            <div
              className="flex min-h-20 items-start gap-3 rounded-lg border border-ink/10 bg-white p-4 shadow-insetPanel"
              key={strength}
            >
              <ShieldCheck
                className="mt-0.5 h-5 w-5 shrink-0 text-moss"
                aria-hidden="true"
              />
              <p className="leading-6 text-ink/75">{strength}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink py-16 text-white lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-6 lg:grid-cols-3 lg:px-8">
          {[
            {
              icon: BriefcaseBusiness,
              title: "Product-minded delivery",
              text: "Translate unclear goals into useful releases, with practical tradeoffs visible early.",
            },
            {
              icon: Code2,
              title: "Maintainable systems",
              text: "Build codebases that future teams can read, test, extend, and operate.",
            },
            {
              icon: Rocket,
              title: "Launch discipline",
              text: "Use instrumentation, QA paths, and release notes to reduce surprise at the finish line.",
            },
          ].map((item) => (
            <div className="rounded-lg border border-white/10 bg-white/8 p-6" key={item.title}>
              <item.icon className="h-7 w-7 text-lemon" aria-hidden="true" />
              <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 leading-7 text-white/70">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="section-anchor mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8 lg:py-20"
        id="process"
      >
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-moss">
            Process
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">
            A clear path from messy brief to reliable launch.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {process.map((step, index) => (
            <div
              className="rounded-lg border border-ink/10 bg-white p-6 shadow-insetPanel"
              key={step.title}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-lemon text-sm font-bold text-ink">
                {index + 1}
              </span>
              <h3 className="mt-6 text-xl font-semibold text-ink">
                {step.title}
              </h3>
              <p className="mt-3 leading-7 text-ink/65">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="section-anchor border-t border-ink/10 bg-white py-16 lg:py-20"
        id="contact"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.85fr_1fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">
              Contact
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">
              Bring a product problem, a rough idea, or a build already in
              motion.
            </h2>
            <p className="mt-5 text-base leading-7 text-ink/65">
              This form is a front-end demo with validation and a success state.
              Replace the placeholder links below with your real profiles and
              wire the form to your preferred backend when ready.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {[
                ["GitHub", Github, "#"],
                ["LinkedIn", Linkedin, "#"],
                ["Email", Mail, "mailto:hello@example.com"],
              ].map(([label, Icon, href]) => (
                <a
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-ink/15 bg-paper px-4 text-sm font-semibold text-ink transition hover:border-ink/40"
                  href={href as string}
                  key={label as string}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label as string}
                </a>
              ))}
              <a
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-moss"
                href="#"
              >
                Resume
              </a>
            </div>
          </div>

          <form
            className="rounded-lg border border-ink/10 bg-paper p-5 shadow-soft sm:p-6"
            noValidate
            onSubmit={handleSubmit}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-ink">Name</span>
                <input
                  className="mt-2 min-h-12 w-full rounded-md border border-ink/15 bg-white px-4 text-ink outline-none transition placeholder:text-ink/35 focus:border-moss focus:ring-4 focus:ring-moss/15"
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Your name"
                  value={values.name}
                />
                <FieldError message={errors.name} />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-ink">Email</span>
                <input
                  className="mt-2 min-h-12 w-full rounded-md border border-ink/15 bg-white px-4 text-ink outline-none transition placeholder:text-ink/35 focus:border-moss focus:ring-4 focus:ring-moss/15"
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  value={values.email}
                />
                <FieldError message={errors.email} />
              </label>
            </div>
            <label className="mt-5 block">
              <span className="text-sm font-semibold text-ink">
                Project type or message
              </span>
              <textarea
                className="mt-2 min-h-36 w-full resize-y rounded-md border border-ink/15 bg-white px-4 py-3 text-ink outline-none transition placeholder:text-ink/35 focus:border-moss focus:ring-4 focus:ring-moss/15"
                onChange={(event) => updateField("message", event.target.value)}
                placeholder="What are you trying to ship or improve?"
                value={values.message}
              />
              <FieldError message={errors.message} />
            </label>
            <button
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-clay px-5 text-base font-semibold text-white transition hover:bg-ink sm:w-auto"
              type="submit"
            >
              Send inquiry
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            {submitted ? (
              <p
                className="mt-4 rounded-md border border-moss/20 bg-moss/10 px-4 py-3 text-sm font-semibold text-moss"
                role="status"
              >
                Thanks. This demo captured the inquiry locally and is ready for
                backend delivery wiring.
              </p>
            ) : null}
          </form>
        </div>
      </section>
    </main>
  );
}
