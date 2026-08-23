import { useState } from "react";
import {
  Accordion,
  Button,
  Combobox,
  Dialog,
  Tabs,
  Toast,
  useCombobox,
  useToast,
  type ButtonVariant,
} from "react-headless-primitives";
import { Toaster } from "./Toaster";

const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: "bg-indigo-700 text-white hover:bg-indigo-800",
  secondary: "bg-slate-200 text-slate-900 hover:bg-slate-300",
  ghost: "bg-transparent text-slate-900 hover:bg-slate-100",
  destructive: "bg-red-700 text-white hover:bg-red-800",
};

interface Language {
  code: string;
  name: string;
}

const LANGUAGES: Language[] = [
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ja", name: "Japanese" },
  { code: "pt", name: "Portuguese" },
];

function LanguageOptions() {
  const { items } = useCombobox<Language>();
  if (items.length === 0) {
    return <p className="px-3 py-2 text-sm text-slate-500">No matches.</p>;
  }
  return (
    <>
      {items.map((language) => (
        <Combobox.Item
          key={language.code}
          item={language}
          className="cursor-pointer rounded px-3 py-2 text-sm data-[highlighted]:bg-indigo-700 data-[highlighted]:text-white"
        />
      ))}
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

export function App() {
  return (
    <Toast.Provider>
      <div className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-2xl space-y-8">
          <header>
            <h1 className="text-2xl font-bold text-slate-900">
              react-headless-primitives
            </h1>
            <p className="mt-1 text-slate-600">
              A live demo app consuming the published package like any other npm
              dependency — every visual is Tailwind, every behavior comes from
              the library.
            </p>
          </header>

          <ButtonsSection />
          <DialogSection />
          <TabsSection />
          <AccordionSection />
          <ComboboxSection />
        </div>
      </div>
      <Toaster />
    </Toast.Provider>
  );
}

function ButtonsSection() {
  return (
    <Section title="Button">
      <div className="flex flex-wrap gap-3">
        {(Object.keys(buttonVariantClasses) as ButtonVariant[]).map(
          (variant) => (
            <Button
              key={variant}
              variant={variant}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${buttonVariantClasses[variant]}`}
            >
              {variant}
            </Button>
          ),
        )}
        <Button
          loading
          className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white data-[loading]:opacity-60"
        >
          Loading
        </Button>
      </div>
    </Section>
  );
}

function DialogSection() {
  const { toast } = useToast();
  return (
    <Section title="Dialog">
      <Dialog.Root>
        <Dialog.Trigger className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800">
          Delete account
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              Delete account
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-slate-600">
              This action cannot be undone. All of your data will be permanently
              removed.
            </Dialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Cancel
              </Dialog.Close>
              <Dialog.Close
                onClick={() => toast({ title: "Account deleted" })}
                className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
              >
                Confirm
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Section>
  );
}

function TabsSection() {
  return (
    <Section title="Tabs">
      <Tabs.Root defaultValue="profile">
        <Tabs.List
          aria-label="Account settings"
          className="flex gap-1 border-b border-slate-200"
        >
          {["profile", "account", "billing"].map((value) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className="border-b-2 border-transparent px-3 py-2 text-sm font-medium text-slate-600 capitalize data-[state=active]:border-indigo-700 data-[state=active]:text-indigo-700"
            >
              {value}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="profile" className="pt-4 text-sm text-slate-600">
          Profile settings go here.
        </Tabs.Content>
        <Tabs.Content value="account" className="pt-4 text-sm text-slate-600">
          Account settings go here.
        </Tabs.Content>
        <Tabs.Content value="billing" className="pt-4 text-sm text-slate-600">
          Billing settings go here.
        </Tabs.Content>
      </Tabs.Root>
    </Section>
  );
}

function AccordionSection() {
  return (
    <Section title="Accordion">
      <Accordion.Root type="single" collapsible defaultValue="shipping">
        {[
          {
            value: "shipping",
            question: "How long does shipping take?",
            answer: "Orders ship within 2 business days.",
          },
          {
            value: "returns",
            question: "What is your return policy?",
            answer: "Items can be returned within 30 days of delivery.",
          },
        ].map((item) => (
          <Accordion.Item
            key={item.value}
            value={item.value}
            className="border-b border-slate-200 last:border-0"
          >
            <Accordion.Header>
              <Accordion.Trigger className="flex w-full items-center justify-between py-3 text-left text-sm font-medium text-slate-900">
                {item.question}
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="pb-3 text-sm text-slate-600">
              {item.answer}
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </Section>
  );
}

function ComboboxSection() {
  const [value, setValue] = useState<Language | undefined>();
  return (
    <Section title="Combobox">
      <div className="relative w-64">
        <Combobox.Root
          items={LANGUAGES}
          itemToString={(lang) => lang.name}
          itemToKey={(lang) => lang.code}
          value={value}
          onValueChange={setValue}
        >
          <Combobox.Input
            aria-label="Language"
            placeholder="Search language…"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <Combobox.Content className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white p-1 shadow-lg">
            <LanguageOptions />
          </Combobox.Content>
        </Combobox.Root>
      </div>
    </Section>
  );
}
