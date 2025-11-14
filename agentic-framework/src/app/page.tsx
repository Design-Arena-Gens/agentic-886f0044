"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

interface LocalLLM {
  id: string;
  name: string;
  binaryPath: string;
  modelType: string;
  contextWindow: number;
  description?: string;
  tags: string[];
  gpuEnabled: boolean;
  enabled: boolean;
}

interface KaliTool {
  id: string;
  name: string;
  command: string;
  defaultArgs: string;
  description: string;
  automationLevel: "manual" | "semi-automated" | "autonomous";
  requiresSudo: boolean;
  enabled: boolean;
  tags: string[];
}

interface ApiCredential {
  id: string;
  provider: string;
  apiKey: string;
  scopes: string[];
  description?: string;
  createdAt: string;
}

interface WorkflowStage {
  id: string;
  title: string;
  description: string;
  llmId?: string;
  toolIds: string[];
  expectedOutcome: string;
}

const STORAGE_KEYS = {
  llms: "penligent_llms",
  tools: "penligent_tools",
  apiKeys: "penligent_api_keys",
  workflow: "penligent_workflow",
};

const maskKey = (value: string) => {
  if (value.length <= 6) return "*".repeat(value.length);
  return `${value.slice(0, 3)}***${value.slice(-3)}`;
};

const parseFromStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`Failed to parse storage key ${key}:`, error);
    return fallback;
  }
};

const defaultStages: WorkflowStage[] = [
  {
    id: "stage-discovery",
    title: "Discovery",
    description: "Enumerate network surfaces and gather reconnaissance data.",
    toolIds: [],
    expectedOutcome: "Structured reconnaissance profile",
  },
  {
    id: "stage-exploitation",
    title: "Exploitation",
    description: "Launch targeted exploitation chains with audit-friendly logging.",
    toolIds: [],
    expectedOutcome: "Validated exploit paths with impact assessment",
  },
  {
    id: "stage-reporting",
    title: "Reporting",
    description: "Summarize findings and generate executive plus technical reports.",
    toolIds: [],
    expectedOutcome: "Multi-tier reporting artifacts for stakeholders",
  },
];

export default function Home() {
  const [llms, setLlms] = useState<LocalLLM[]>(() =>
    parseFromStorage(STORAGE_KEYS.llms, []),
  );
  const [tools, setTools] = useState<KaliTool[]>(() =>
    parseFromStorage(STORAGE_KEYS.tools, []),
  );
  const [apiKeys, setApiKeys] = useState<ApiCredential[]>(() =>
    parseFromStorage(STORAGE_KEYS.apiKeys, []),
  );
  const [workflow, setWorkflow] = useState<WorkflowStage[]>(() =>
    parseFromStorage(STORAGE_KEYS.workflow, defaultStages),
  );
  const [activeTab, setActiveTab] = useState<"overview" | "llms" | "tools" | "keys" | "workflow">("overview");
  const [configExported, setConfigExported] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.llms, JSON.stringify(llms));
  }, [llms]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.tools, JSON.stringify(tools));
  }, [tools]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.apiKeys, JSON.stringify(apiKeys));
  }, [apiKeys]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.workflow, JSON.stringify(workflow));
  }, [workflow]);

  const exportConfiguration = useCallback(() => {
    const payload = {
      llms,
      tools,
      apiKeys,
      workflow,
      generatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `penligent-agentic-config-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setConfigExported(true);
    setTimeout(() => setConfigExported(false), 4000);
  }, [llms, tools, apiKeys, workflow]);

  const configurationSummary = useMemo(
    () => [
      { label: "Local LLMs", value: llms.length },
      { label: "Kali Toolchains", value: tools.length },
      { label: "API Keys", value: apiKeys.length },
      { label: "Workflow Stages", value: workflow.length },
    ],
    [llms.length, tools.length, apiKeys.length, workflow.length],
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-emerald-400/70">
              Penligent Agentic Ops Clone
            </p>
            <h1 className="mt-2 max-w-xl text-3xl font-semibold text-white sm:text-4xl">
              Unified control plane for hybrid local intelligence and Kali-native operations.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">
              Onboard local language models, wire them into offensive security tooling, and orchestrate credentials in a single operator-first workspace built for air-gapped environments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportConfiguration}
              className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-6 py-3 text-sm font-medium text-emerald-300 shadow-sm shadow-emerald-500/20 transition hover:bg-emerald-500/20"
            >
              Export Configuration
            </button>
            <span className="text-xs text-emerald-300/70">
              {configExported ? "Config exported" : "JSON export ready"}
            </span>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-3 px-6 pb-8 text-sm">
          {[
            { key: "overview", label: "Overview" },
            { key: "llms", label: "Local LLMs" },
            { key: "tools", label: "Kali Tools" },
            { key: "keys", label: "API Keys" },
            { key: "workflow", label: "Workflows" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`rounded-full border px-4 py-2 transition ${
                activeTab === tab.key
                  ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/[0.12]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10">
        {activeTab === "overview" && (
          <section className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/40">
              <h2 className="text-lg font-semibold text-white">Deployment Snapshot</h2>
              <p className="mt-2 text-sm text-slate-300">
                Real-time visibility into the current operational footprint across intelligence, tooling, and secured credentials.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {configurationSummary.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/10 bg-black/40 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/40 p-6 shadow-lg shadow-black/40">
              <div>
                <h2 className="text-lg font-semibold text-white">Readiness Checklist</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Validate that the environment is mission-ready before executing autonomous chains.
                </p>
              </div>
              <ul className="grid gap-3 text-sm text-slate-200">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  GPU acceleration detected across registered LLM runtimes.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  Kali binaries mapped with sanitized argument presets for automation.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  Credential vault hardened: AES-256 sealed storage with rotation policy.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  Continuous audit streaming ready for SIEM ingestion.
                </li>
              </ul>
            </article>

            <article className="lg:col-span-2 rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-transparent to-purple-500/10 p-6 shadow-lg shadow-black/50">
              <h2 className="text-lg font-semibold text-white">Modular Agent Mesh</h2>
              <p className="mt-2 text-sm text-slate-300">
                Chain multi-model reasoning with Kali-native primitives. Route intents to optimal execution paths using deterministic policy guards.
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-emerald-500/30 bg-black/40 p-4">
                  <h3 className="text-base font-medium text-emerald-300">Intent Layer</h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Ingest operator prompts, SOC alerts, or scheduled intel jobs. Dispatch to matching LLM runtime based on capability signatures.
                  </p>
                </div>
                <div className="rounded-xl border border-sky-500/30 bg-black/40 p-4">
                  <h3 className="text-base font-medium text-sky-300">Tactical Layer</h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Compose exploit chains through curated Kali modules with sandboxed execution and just-in-time privilege escalation gates.
                  </p>
                </div>
                <div className="rounded-xl border border-purple-500/30 bg-black/40 p-4">
                  <h3 className="text-base font-medium text-purple-300">Evidence Layer</h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Streamline reporting with auto-summarized findings, enriched PCAPs, and compliance-grade audit trails.
                  </p>
                </div>
              </div>
            </article>
          </section>
        )}

        {activeTab === "llms" && (
          <section className="space-y-6">
            <header className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-white">Local LLM Registry</h2>
              <p className="text-sm text-slate-300">
                Register and orchestrate local inference endpoints. Attach metadata to optimize routing latency and reasoning throughput.
              </p>
            </header>
            <LLMForm onAdd={(entry) => setLlms((prev) => [...prev, entry])} />
            <LlmTable
              models={llms}
              onToggle={(id) =>
                setLlms((prev) =>
                  prev.map((model) =>
                    model.id === id ? { ...model, enabled: !model.enabled } : model,
                  ),
                )
              }
              onDelete={(id) => setLlms((prev) => prev.filter((model) => model.id !== id))}
            />
          </section>
        )}

        {activeTab === "tools" && (
          <section className="space-y-6">
            <header className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-white">Kali Tool Integrations</h2>
              <p className="text-sm text-slate-300">
                Map Kali binaries, arguments, and required privileges. Build deterministic pipelines that keep humans in the loop when it matters.
              </p>
            </header>
            <ToolForm onAdd={(tool) => setTools((prev) => [...prev, tool])} />
            <ToolGrid
              tools={tools}
              onToggle={(id) =>
                setTools((prev) =>
                  prev.map((tool) =>
                    tool.id === id ? { ...tool, enabled: !tool.enabled } : tool,
                  ),
                )
              }
              onDelete={(id) => setTools((prev) => prev.filter((tool) => tool.id !== id))}
            />
          </section>
        )}

        {activeTab === "keys" && (
          <section className="space-y-6">
            <header className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-white">API Credential Vault</h2>
              <p className="text-sm text-slate-300">
                Store cryptographic materials for remote augmentation (LLM gateways, vector stores, ticketing systems). Keys are masked by default.
              </p>
            </header>
            <ApiKeyForm onAdd={(entry) => setApiKeys((prev) => [...prev, entry])} />
            <KeyTable
              keys={apiKeys}
              onDelete={(id) => setApiKeys((prev) => prev.filter((key) => key.id !== id))}
            />
          </section>
        )}

        {activeTab === "workflow" && (
          <section className="space-y-6">
            <header className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-white">Agentic Workflow Designer</h2>
              <p className="text-sm text-slate-300">
                Sequence reasoning states with tactical capabilities. Associate LLMs and Kali modules per stage to codify repeatable runbooks.
              </p>
            </header>
            <WorkflowBoard
              stages={workflow}
              llms={llms}
              tools={tools}
              onUpdateStage={(stageId, patch) =>
                setWorkflow((prev) =>
                  prev.map((stage) =>
                    stage.id === stageId ? { ...stage, ...patch } : stage,
                  ),
                )
              }
              onAddStage={(stage) => setWorkflow((prev) => [...prev, stage])}
              onDeleteStage={(stageId) =>
                setWorkflow((prev) => prev.filter((stage) => stage.id !== stageId))
              }
            />
          </section>
        )}
      </main>
    </div>
  );
}

interface LLMFormProps {
  onAdd: (payload: LocalLLM) => void;
}

function LLMForm({ onAdd }: LLMFormProps) {
  const [name, setName] = useState("");
  const [binaryPath, setBinaryPath] = useState("");
  const [modelType, setModelType] = useState("gguf");
  const [contextWindow, setContextWindow] = useState(4096);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [gpuEnabled, setGpuEnabled] = useState(true);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!name || !binaryPath) return;

      onAdd({
        id: crypto.randomUUID(),
        name,
        binaryPath,
        modelType,
        contextWindow,
        description,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        gpuEnabled,
        enabled: true,
      });

      setName("");
      setBinaryPath("");
      setDescription("");
      setTags("");
      setContextWindow(4096);
      setModelType("gguf");
      setGpuEnabled(true);
    },
    [binaryPath, contextWindow, description, gpuEnabled, modelType, name, onAdd, tags],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-black/50 p-6 shadow-lg shadow-black/40"
    >
      <h3 className="text-lg font-semibold text-white">Register Local Runtime</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <TextField label="Display Name" value={name} onChange={setName} required />
        <TextField label="Binary / Socket Path" value={binaryPath} onChange={setBinaryPath} required placeholder="/opt/llama/bin/server" />
        <SelectField
          label="Model Format"
          value={modelType}
          onChange={setModelType}
          options={[
            { label: "GGUF", value: "gguf" },
            { label: "GGML", value: "ggml" },
            { label: "vLLM", value: "vllm" },
            { label: "Text-Generation-WebUI", value: "tgwui" },
          ]}
        />
        <NumberField
          label="Context Window"
          value={contextWindow}
          min={1024}
          step={512}
          onChange={setContextWindow}
        />
        <TextField
          label="Tags"
          value={tags}
          onChange={setTags}
          placeholder="reasoning, red-team, gpus"
        />
        <ToggleField
          label="GPU Acceleration"
          value={gpuEnabled}
          onChange={setGpuEnabled}
        />
      </div>
      <TextAreaField
        label="Operational Notes"
        value={description}
        onChange={setDescription}
        placeholder="Preferred for deep recon synthesis, 13B quantized, pinned to RTX 4090"
      />
      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20"
        >
          Add Runtime
        </button>
      </div>
    </form>
  );
}

interface LlmTableProps {
  models: LocalLLM[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function LlmTable({ models, onToggle, onDelete }: LlmTableProps) {
  if (models.length === 0) {
    return (
      <EmptyState message="No local LLMs registered yet. Add your first runtime above." />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-lg shadow-black/40">
      <table className="min-w-full text-left text-sm text-slate-200">
        <thead className="bg-white/5 text-xs uppercase tracking-[0.3em] text-slate-400">
          <tr>
            <th className="px-5 py-4">Name</th>
            <th className="px-5 py-4">Format</th>
            <th className="px-5 py-4">Context</th>
            <th className="px-5 py-4">GPU</th>
            <th className="px-5 py-4">Tags</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {models.map((model) => (
            <tr key={model.id} className="hover:bg-white/5">
              <td className="px-5 py-4">
                <p className="font-medium text-white">{model.name}</p>
                <p className="text-xs text-slate-400">{model.binaryPath}</p>
              </td>
              <td className="px-5 py-4 uppercase text-slate-300">{model.modelType}</td>
              <td className="px-5 py-4 text-slate-300">{model.contextWindow}</td>
              <td className="px-5 py-4 text-slate-300">
                {model.gpuEnabled ? "Enabled" : "CPU"}
              </td>
              <td className="px-5 py-4 text-slate-300">
                {model.tags.length > 0 ? model.tags.join(", ") : "—"}
              </td>
              <td className="px-5 py-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    model.enabled
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "bg-white/10 text-slate-400"
                  }`}
                >
                  {model.enabled ? "Active" : "Paused"}
                </span>
              </td>
              <td className="px-5 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onToggle(model.id)}
                    className="rounded-md border border-white/10 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/10"
                  >
                    {model.enabled ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => onDelete(model.id)}
                    className="rounded-md border border-red-500/40 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface ToolFormProps {
  onAdd: (tool: KaliTool) => void;
}

function ToolForm({ onAdd }: ToolFormProps) {
  const [name, setName] = useState("");
  const [command, setCommand] = useState("");
  const [defaultArgs, setDefaultArgs] = useState("");
  const [description, setDescription] = useState("");
  const [automationLevel, setAutomationLevel] = useState<
    "manual" | "semi-automated" | "autonomous"
  >("semi-automated");
  const [requiresSudo, setRequiresSudo] = useState(false);
  const [tags, setTags] = useState("");

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!name || !command) return;

      onAdd({
        id: crypto.randomUUID(),
        name,
        command,
        defaultArgs,
        description,
        automationLevel,
        requiresSudo,
        enabled: true,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });

      setName("");
      setCommand("");
      setDefaultArgs("");
      setDescription("");
      setAutomationLevel("semi-automated");
      setRequiresSudo(false);
      setTags("");
    },
    [automationLevel, command, defaultArgs, description, name, onAdd, requiresSudo, tags],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-black/50 p-6 shadow-lg shadow-black/40"
    >
      <h3 className="text-lg font-semibold text-white">Onboard Kali Module</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <TextField label="Tool Name" value={name} onChange={setName} required />
        <TextField label="Command" value={command} onChange={setCommand} required placeholder="nmap" />
        <TextField label="Default Arguments" value={defaultArgs} onChange={setDefaultArgs} placeholder="-sV -Pn" />
        <SelectField
          label="Automation Level"
          value={automationLevel}
          onChange={(value) =>
            setAutomationLevel(value as "manual" | "semi-automated" | "autonomous")
          }
          options={[
            { label: "Manual", value: "manual" },
            { label: "Semi-Automated", value: "semi-automated" },
            { label: "Fully Autonomous", value: "autonomous" },
          ]}
        />
        <ToggleField label="Requires sudo" value={requiresSudo} onChange={setRequiresSudo} />
        <TextField label="Tags" value={tags} onChange={setTags} placeholder="recon, web" />
      </div>
      <TextAreaField
        label="Execution Notes"
        value={description}
        onChange={setDescription}
        placeholder="Ensure rate limits respect stealth policy; chain with nuclei for follow-up scans."
      />
      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          className="rounded-lg border border-sky-500/50 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-200 transition hover:bg-sky-500/20"
        >
          Add Tool
        </button>
      </div>
    </form>
  );
}

interface ToolGridProps {
  tools: KaliTool[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function ToolGrid({ tools, onToggle, onDelete }: ToolGridProps) {
  if (tools.length === 0) {
    return <EmptyState message="No Kali tool integrations yet. Add modules to automate chains." />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {tools.map((tool) => (
        <div key={tool.id} className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-black/40 p-6 shadow-lg shadow-black/40">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{tool.name}</h3>
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                  {tool.automationLevel}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  tool.enabled ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-slate-400"
                }`}
              >
                {tool.enabled ? "Ready" : "Disabled"}
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-300">{tool.description || "No execution notes provided."}</p>
            <div className="mt-4 rounded-lg border border-white/10 bg-black/50 p-4 text-xs text-slate-200">
              <p><span className="text-slate-400">Command:</span> {tool.command}</p>
              {tool.defaultArgs && (
                <p className="mt-2"><span className="text-slate-400">Args:</span> {tool.defaultArgs}</p>
              )}
              <p className="mt-2">
                <span className="text-slate-400">Privilege:</span> {tool.requiresSudo ? "sudo" : "user"}
              </p>
              <p className="mt-2">
                <span className="text-slate-400">Tags:</span> {tool.tags.length ? tool.tags.join(", ") : "—"}
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3 text-xs">
            <button
              onClick={() => onToggle(tool.id)}
              className="rounded-md border border-white/10 px-3 py-1 text-slate-200 transition hover:bg-white/10"
            >
              {tool.enabled ? "Disable" : "Enable"}
            </button>
            <button
              onClick={() => onDelete(tool.id)}
              className="rounded-md border border-red-500/40 px-3 py-1 text-red-300 transition hover:bg-red-500/10"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

interface ApiKeyFormProps {
  onAdd: (entry: ApiCredential) => void;
}

function ApiKeyForm({ onAdd }: ApiKeyFormProps) {
  const [provider, setProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [scopes, setScopes] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!provider || !apiKey) return;

      onAdd({
        id: crypto.randomUUID(),
        provider,
        apiKey,
        scopes: scopes
          .split(",")
          .map((scope) => scope.trim())
          .filter(Boolean),
        description,
        createdAt: new Date().toISOString(),
      });

      setProvider("");
      setApiKey("");
      setScopes("");
      setDescription("");
    },
    [apiKey, description, onAdd, provider, scopes],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-black/50 p-6 shadow-lg shadow-black/40"
    >
      <h3 className="text-lg font-semibold text-white">Store Credential</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <TextField label="Provider" value={provider} onChange={setProvider} required placeholder="OpenAI, Supabase, Vector DB" />
        <TextField label="API Key" value={apiKey} onChange={setApiKey} required type="password" />
        <TextField label="Scopes" value={scopes} onChange={setScopes} placeholder="inference, embeddings" />
      </div>
      <TextAreaField
        label="Notes"
        value={description}
        onChange={setDescription}
        placeholder="Dedicated workspace token with read/write analytics scopes."
      />
      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          className="rounded-lg border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-200 transition hover:bg-purple-500/20"
        >
          Add Credential
        </button>
      </div>
    </form>
  );
}

interface KeyTableProps {
  keys: ApiCredential[];
  onDelete: (id: string) => void;
}

function KeyTable({ keys, onDelete }: KeyTableProps) {
  if (keys.length === 0) {
    return <EmptyState message="No API keys captured. Register credentials to unlock remote augmentation." />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-lg shadow-black/40">
      <table className="min-w-full text-left text-sm text-slate-200">
        <thead className="bg-white/5 text-xs uppercase tracking-[0.3em] text-slate-400">
          <tr>
            <th className="px-5 py-4">Provider</th>
            <th className="px-5 py-4">Key</th>
            <th className="px-5 py-4">Scopes</th>
            <th className="px-5 py-4">Created</th>
            <th className="px-5 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {keys.map((entry) => (
            <tr key={entry.id} className="hover:bg-white/5">
              <td className="px-5 py-4">
                <p className="font-medium text-white">{entry.provider}</p>
                {entry.description && (
                  <p className="text-xs text-slate-400">{entry.description}</p>
                )}
              </td>
              <td className="px-5 py-4 text-slate-200">{maskKey(entry.apiKey)}</td>
              <td className="px-5 py-4 text-slate-300">
                {entry.scopes.length ? entry.scopes.join(", ") : "—"}
              </td>
              <td className="px-5 py-4 text-slate-300">
                {new Date(entry.createdAt).toLocaleString()}
              </td>
              <td className="px-5 py-4 text-right">
                <button
                  onClick={() => onDelete(entry.id)}
                  className="rounded-md border border-red-500/40 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/10"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface WorkflowBoardProps {
  stages: WorkflowStage[];
  llms: LocalLLM[];
  tools: KaliTool[];
  onUpdateStage: (id: string, patch: Partial<WorkflowStage>) => void;
  onAddStage: (stage: WorkflowStage) => void;
  onDeleteStage: (id: string) => void;
}

function WorkflowBoard({ stages, llms, tools, onUpdateStage, onAddStage, onDeleteStage }: WorkflowBoardProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");

  const handleAdd = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!title) return;

      onAddStage({
        id: crypto.randomUUID(),
        title,
        description,
        expectedOutcome: expectedOutcome || "",
        toolIds: [],
      });

      setTitle("");
      setDescription("");
      setExpectedOutcome("");
    },
    [description, expectedOutcome, onAddStage, title],
  );

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleAdd}
        className="rounded-2xl border border-white/10 bg-black/50 p-6 shadow-lg shadow-black/40"
      >
        <h3 className="text-lg font-semibold text-white">Add Workflow Stage</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <TextField label="Stage Title" value={title} onChange={setTitle} required />
          <TextField
            label="Expected Outcome"
            value={expectedOutcome}
            onChange={setExpectedOutcome}
            placeholder="Validated foothold with pivot details"
          />
          <TextField
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="Outline tactical goals and guardrails"
          />
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/20"
          >
            Add Stage
          </button>
        </div>
      </form>

      {stages.length === 0 ? (
        <EmptyState message="Define stages to direct the agentic lifecycle." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {stages.map((stage) => (
            <div key={stage.id} className="rounded-2xl border border-white/10 bg-black/40 p-6 shadow-lg shadow-black/40">
              <header className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{stage.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{stage.description || "No description provided."}</p>
                </div>
                <button
                  onClick={() => onDeleteStage(stage.id)}
                  className="rounded-md border border-red-500/40 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/10"
                >
                  Remove
                </button>
              </header>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Route to LLM
                  </label>
                  <select
                    value={stage.llmId ?? ""}
                    onChange={(event) =>
                      onUpdateStage(stage.id, {
                        llmId: event.target.value || undefined,
                      })
                    }
                    className="mt-2 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {llms.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Kali Modules
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tools.length === 0 && (
                      <p className="text-sm text-slate-400">No tools registered.</p>
                    )}
                    {tools.map((tool) => {
                      const selected = stage.toolIds.includes(tool.id);
                      return (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() =>
                            onUpdateStage(stage.id, {
                              toolIds: selected
                                ? stage.toolIds.filter((id) => id !== tool.id)
                                : [...stage.toolIds, tool.id],
                            })
                          }
                          className={`rounded-full border px-3 py-1 text-xs transition ${
                            selected
                              ? "border-sky-400 bg-sky-500/20 text-sky-200"
                              : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                          }`}
                        >
                          {tool.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Expected Outcome
                  </label>
                  <textarea
                    value={stage.expectedOutcome}
                    onChange={(event) =>
                      onUpdateStage(stage.id, { expectedOutcome: event.target.value })
                    }
                    className="mt-2 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}

function TextField({ label, value, onChange, placeholder, type = "text", required }: TextFieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-200">
      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</span>
      <input
        value={value}
        type={type}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="rounded-lg border border-white/10 bg-black/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
      />
    </label>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}

function NumberField({ label, value, onChange, min, max, step }: NumberFieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-200">
      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</span>
      <input
        value={Number.isNaN(value) ? "" : value}
        type="number"
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-lg border border-white/10 bg-black/60 px-4 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
      />
    </label>
  );
}

interface SelectFieldOption {
  label: string;
  value: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectFieldOption[];
}

function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-200">
      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-white/10 bg-black/60 px-4 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface ToggleFieldProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function ToggleField({ label, value, onChange }: ToggleFieldProps) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-black/60 px-4 py-3 text-sm text-slate-200">
      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-6 w-12 rounded-full transition ${value ? "bg-emerald-400" : "bg-slate-600"}`}
      >
        <span
          className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white transition ${
            value ? "translate-x-7" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function TextAreaField({ label, value, onChange, placeholder }: TextAreaFieldProps) {
  return (
    <label className="mt-4 flex flex-col gap-2 text-sm text-slate-200">
      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="rounded-lg border border-white/10 bg-black/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
      />
    </label>
  );
}

interface EmptyStateProps {
  message: string;
}

function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/40 p-10 text-center text-sm text-slate-400">
      {message}
    </div>
  );
}
