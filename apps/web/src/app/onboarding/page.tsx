"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Nav } from "@/shared/Nav";
import { api } from "@/shared/api";

type OnboardingState = {
  path: string | null;
  state: string;
  step: string | null;
  saved: {
    preferredName: string | null;
    targets: string[];
    locations: string[];
    remoteModes: string[];
  };
  progress: Record<string, number | boolean>;
};

const STEPS = ["path", "contact", "targets", "education", "resume", "consent"] as const;

export default function OnboardingPage() {
  const [data, setData] = useState<OnboardingState | null>(null);
  const [path, setPath] = useState<"EXPERIENCED" | "FRESHER">("EXPERIENCED");
  const [name, setName] = useState("");
  const [titles, setTitles] = useState("Software Engineer, Backend Engineer");
  const [institution, setInstitution] = useState("State University");
  const [projectName, setProjectName] = useState("Portfolio API");
  const [skillName, setSkillName] = useState("TypeScript");
  const [workCountry, setWorkCountry] = useState("IN");
  const [workStatus, setWorkStatus] = useState("CITIZEN");
  const [message, setMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>("path");

  useEffect(() => {
    api<OnboardingState>("/onboarding")
      .then((d) => {
        setData(d);
        if (d.path === "FRESHER" || d.path === "EXPERIENCED") setPath(d.path);
        if (d.saved.preferredName) setName(d.saved.preferredName);
        if (d.saved.targets.length) setTitles(d.saved.targets.join(", "));
        if (d.step) setCurrentStep(d.step);
        else if (d.state === "COMPLETED") setCurrentStep("consent");
      })
      .catch(() => {});
  }, []);

  async function refresh() {
    const d = await api<OnboardingState>("/onboarding");
    setData(d);
    if (d.step) setCurrentStep(d.step);
  }

  async function savePath() {
    await api("/onboarding/path", { method: "PUT", json: { path } });
    setMessage("Path saved");
    setCurrentStep("contact");
    await refresh();
  }

  async function saveContact() {
    await api("/onboarding/contact", { method: "PUT", json: { preferredName: name } });
    setMessage("Contact saved");
    setCurrentStep("targets");
    await refresh();
  }

  async function saveTargets() {
    await api("/onboarding/targets", {
      method: "PUT",
      json: {
        titles: titles.split(",").map((t) => t.trim()).filter(Boolean),
        locations: ["Bangalore"],
        remoteModes: ["HYBRID", "REMOTE"],
      },
    });
    setMessage("Targets saved");
    setCurrentStep(path === "FRESHER" ? "education" : "resume");
    await refresh();
  }

  async function addEducation() {
    await api("/profile/educations", { method: "POST", json: { institution, degree: "Bachelor" } });
    setMessage("Education added");
    await refresh();
  }

  async function addProject() {
    await api("/profile/projects", { method: "POST", json: { name: projectName } });
    setMessage("Project added");
    await refresh();
  }

  async function addSkill() {
    await api("/profile/skills", { method: "POST", json: { name: skillName } });
    setMessage("Skill added");
    await refresh();
  }

  async function addWorkAuth() {
    await api("/profile/work-authorisations", {
      method: "POST",
      json: { country: workCountry, status: workStatus },
    });
    setMessage("Work authorisation saved");
    setCurrentStep("consent");
    await refresh();
  }

  async function grantConsent() {
    await api("/onboarding/consent", { method: "POST" });
    setMessage("Consent granted");
    await refresh();
  }

  async function complete() {
    const result = await api<{ completed: boolean; blockers?: Array<{ message: string; code: string }> }>(
      "/onboarding/complete",
      { method: "POST" },
    );
    if (result.completed) {
      setMessage("Onboarding complete!");
    } else {
      setMessage(result.blockers?.map((b) => b.message).join("; ") ?? "Incomplete");
    }
    await refresh();
  }

  const stepIndex = STEPS.indexOf(currentStep as typeof STEPS[number]);

  return (
    <main>
      <Nav />
      <div className="container">
        <h1>Onboarding</h1>
        <p>
          Step {stepIndex + 1} of {STEPS.length}: {currentStep}
          {data?.state === "COMPLETED" && " — completed"}
        </p>
        {message && <div className="alert alert-info" role="status">{message}</div>}

        {(currentStep === "path" || !data?.progress.hasPath) && (
          <div className="card">
            <h2>Choose path</h2>
            <select value={path} onChange={(e) => setPath(e.target.value as "EXPERIENCED" | "FRESHER")}>
              <option value="EXPERIENCED">Experienced</option>
              <option value="FRESHER">Fresher / starting career</option>
            </select>
            <button className="btn btn-secondary" onClick={savePath}>Save path</button>
          </div>
        )}

        {currentStep === "contact" && (
          <div className="card">
            <h2>Contact</h2>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Preferred name" />
            <button className="btn btn-secondary" onClick={saveContact}>Save contact</button>
          </div>
        )}

        {currentStep === "targets" && (
          <div className="card">
            <h2>Target titles</h2>
            <input value={titles} onChange={(e) => setTitles(e.target.value)} placeholder="Comma-separated titles" />
            <button className="btn btn-secondary" onClick={saveTargets}>Save targets</button>
          </div>
        )}

        {currentStep === "education" && path === "FRESHER" && (
          <div className="card">
            <h2>Education & projects (fresher)</h2>
            <input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Institution" />
            <button className="btn btn-secondary" onClick={addEducation}>Add education</button>
            <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project name" />
            <button className="btn btn-secondary" onClick={addProject}>Add project</button>
            <input value={skillName} onChange={(e) => setSkillName(e.target.value)} placeholder="Skill" />
            <button className="btn btn-secondary" onClick={addSkill}>Add skill</button>
            <button className="btn btn-primary" onClick={() => setCurrentStep("resume")}>Continue to resume</button>
          </div>
        )}

        {currentStep === "resume" && (
          <div className="card">
            <h2>Resume</h2>
            <p>Upload and activate a resume before completing.</p>
            <Link href="/resumes" className="btn btn-secondary">Go to resumes</Link>
            <button className="btn btn-secondary" onClick={() => setCurrentStep("consent")}>Continue</button>
          </div>
        )}

        {(currentStep === "consent" || data?.progress.hasActiveResume) && (
          <div className="card">
            <h2>Work authorisation & consent</h2>
            <input value={workCountry} onChange={(e) => setWorkCountry(e.target.value)} placeholder="Country code" />
            <select value={workStatus} onChange={(e) => setWorkStatus(e.target.value)}>
              <option value="CITIZEN">Citizen</option>
              <option value="PERMANENT_RESIDENT">Permanent resident</option>
              <option value="WORK_VISA">Work visa</option>
            </select>
            <button className="btn btn-secondary" onClick={addWorkAuth}>Save work authorisation</button>
            <button className="btn btn-secondary" onClick={grantConsent}>Grant consent</button>
            <button className="btn btn-primary" onClick={complete}>Complete onboarding</button>
          </div>
        )}
      </div>
    </main>
  );
}
