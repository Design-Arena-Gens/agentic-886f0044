"""Penligent-style agentic framework clone runtime utilities.

This module offers a strongly typed control plane for orchestrating local LLM
runtimes, Kali Linux tooling, and secure credential storage. It is designed to
back the accompanying Next.js interface but can operate independently for CLI
or scripted usage.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional
import json


@dataclass(slots=True)
class LocalLLMConfig:
    """Configuration for a local language model runtime."""

    name: str
    binary_path: Path
    model_type: str = "gguf"
    context_window: int = 4096
    description: str = ""
    tags: List[str] = field(default_factory=list)
    gpu_enabled: bool = True
    enabled: bool = True

    def to_dict(self) -> Dict[str, object]:
        payload = asdict(self)
        payload["binary_path"] = str(self.binary_path)
        return payload


@dataclass(slots=True)
class KaliToolConfig:
    """Declarative definition for a Kali Linux tool integration."""

    name: str
    command: str
    default_args: str = ""
    description: str = ""
    automation_level: str = "semi-automated"
    requires_sudo: bool = False
    enabled: bool = True
    tags: List[str] = field(default_factory=list)


@dataclass(slots=True)
class ApiCredential:
    """Stored API key metadata for remote integrations."""

    provider: str
    api_key: str
    scopes: List[str] = field(default_factory=list)
    description: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)

    def masked_key(self) -> str:
        if len(self.api_key) <= 6:
            return "*" * len(self.api_key)
        return f"{self.api_key[:3]}***{self.api_key[-3:]}"


@dataclass(slots=True)
class WorkflowStage:
    """A structured phase in the agentic execution graph."""

    title: str
    expected_outcome: str = ""
    description: str = ""
    llm_name: Optional[str] = None
    tool_names: List[str] = field(default_factory=list)


@dataclass(slots=True)
class AgenticSnapshot:
    """Serializable snapshot of the control plane state."""

    llms: List[LocalLLMConfig]
    tools: List[KaliToolConfig]
    credentials: List[ApiCredential]
    workflow: List[WorkflowStage]
    generated_at: datetime = field(default_factory=datetime.utcnow)

    def to_json(self, pretty: bool = True) -> str:
        payload = {
            "llms": [llm.to_dict() for llm in self.llms],
            "tools": [asdict(tool) for tool in self.tools],
            "credentials": [
                {
                    **asdict(cred),
                    "created_at": cred.created_at.isoformat(),
                }
                for cred in self.credentials
            ],
            "workflow": [asdict(stage) for stage in self.workflow],
            "generated_at": self.generated_at.isoformat(),
        }
        if pretty:
            return json.dumps(payload, indent=2, sort_keys=True)
        return json.dumps(payload)

    def write(self, output_path: Path) -> None:
        output_path.write_text(self.to_json(pretty=True), encoding="utf-8")


class AgenticControlPlane:
    """In-memory registry mimicking Penligent's agentic framework."""

    def __init__(self) -> None:
        self._llms: Dict[str, LocalLLMConfig] = {}
        self._tools: Dict[str, KaliToolConfig] = {}
        self._credentials: Dict[str, ApiCredential] = {}
        self._workflow: List[WorkflowStage] = []

    # --- LLM Management -------------------------------------------------
    def register_llm(self, config: LocalLLMConfig) -> None:
        self._llms[config.name] = config

    def remove_llm(self, name: str) -> None:
        self._llms.pop(name, None)

    def enable_llm(self, name: str, enabled: bool = True) -> None:
        if name in self._llms:
            self._llms[name].enabled = enabled

    def list_llms(self) -> List[LocalLLMConfig]:
        return list(self._llms.values())

    # --- Kali Tooling ---------------------------------------------------
    def register_tool(self, config: KaliToolConfig) -> None:
        self._tools[config.name] = config

    def remove_tool(self, name: str) -> None:
        self._tools.pop(name, None)

    def toggle_tool(self, name: str, enabled: bool = True) -> None:
        if name in self._tools:
            self._tools[name].enabled = enabled

    def list_tools(self) -> List[KaliToolConfig]:
        return list(self._tools.values())

    # --- API Credentials ------------------------------------------------
    def store_credential(self, credential: ApiCredential) -> None:
        self._credentials[credential.provider] = credential

    def remove_credential(self, provider: str) -> None:
        self._credentials.pop(provider, None)

    def list_credentials(self) -> List[ApiCredential]:
        return list(self._credentials.values())

    # --- Workflow Stages ------------------------------------------------
    def define_workflow(self, stages: Iterable[WorkflowStage]) -> None:
        self._workflow = list(stages)

    def append_stage(self, stage: WorkflowStage) -> None:
        self._workflow.append(stage)

    def purge_stage(self, title: str) -> None:
        self._workflow = [stage for stage in self._workflow if stage.title != title]

    def list_workflow(self) -> List[WorkflowStage]:
        return list(self._workflow)

    # --- Snapshotting ---------------------------------------------------
    def snapshot(self) -> AgenticSnapshot:
        return AgenticSnapshot(
            llms=self.list_llms(),
            tools=self.list_tools(),
            credentials=self.list_credentials(),
            workflow=self.list_workflow(),
        )

    def export(self, output_path: Path) -> None:
        self.snapshot().write(output_path)


__all__ = [
    "AgenticControlPlane",
    "AgenticSnapshot",
    "ApiCredential",
    "KaliToolConfig",
    "LocalLLMConfig",
    "WorkflowStage",
]
