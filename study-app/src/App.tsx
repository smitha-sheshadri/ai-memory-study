import { useEffect, useMemo, useState } from "react";
import bank from "./data/transcripts_bank.json";

type GroupId = "G1" | "G2" | "G3" | "G4";
type Screen = "dev" | "instructions" | "interaction" | "survey" | "done";

type Transcript = {
  transcript_id: string;
  subtype_id: string;
  subtype_code: string;
  subtype_name: string;
  context_id: string;
  context: string;
  user: string;
  memory_updated: string;
  assistant: string;
};

const agree = [
  "Strongly disagree",
  "Disagree",
  "Somewhat disagree",
  "Neither agree nor disagree",
  "Somewhat agree",
  "Agree",
  "Strongly agree",
];

const vuln = [
  "Not at all",
  "Slightly",
  "Somewhat",
  "Moderately",
  "Quite a bit",
  "Very much",
  "Extremely",
];

const surveyItems = [
  {
    id: "PB1",
    text: "If the assistant remembered this information, its future advice could be better tailored to my needs.",
    labels: agree,
  },
  {
    id: "PB2",
    text: "If the assistant remembered this information, its future advice could be more relevant to my situation.",
    labels: agree,
  },
  {
    id: "PB3",
    text: "If the assistant remembered this information, its future advice could be more beneficial to me.",
    labels: agree,
  },
  {
    id: "PV1",
    text: "Knowing that the assistant had this information in its memory would make me feel exposed.",
    labels: vuln,
  },
  {
    id: "PV2",
    text: "Knowing that the assistant had this information in its memory would make me feel unprotected.",
    labels: vuln,
  },
  {
    id: "PV3",
    text: "Knowing that the assistant had this information in its memory would make me feel susceptible.",
    labels: vuln,
  },
  {
    id: "PV4",
    text: "Knowing that the assistant had this information in its memory would make me feel unsafe.",
    labels: vuln,
  },
  {
    id: "PV5",
    text: "Knowing that the assistant had this information in its memory would make me feel vulnerable.",
    labels: vuln,
  },
  {
    id: "PR1",
    text: "I would allow the assistant to remember this information for future interactions.",
    labels: agree,
  },
];

const randGroup = () =>
  ["G1", "G2", "G3", "G4"][Math.floor(Math.random() * 4)] as GroupId;

const makeId = () =>
  `local-${
    crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  }`;

function getParticipantMeta() {
  const p = new URLSearchParams(window.location.search);

  const prolificPid = p.get("PROLIFIC_PID");
  const studyId = p.get("STUDY_ID");
  const sessionId = p.get("SESSION_ID");

  const stored = localStorage.getItem("participant-id");
  const participantId = prolificPid || stored || makeId();

  if (!stored) {
    localStorage.setItem("participant-id", participantId);
  }

  return {
    participantId,
    prolificPid,
    studyId,
    sessionId,
  };
}

export default function App() {
  const dev = import.meta.env.DEV;
  const apiUrl = import.meta.env.VITE_API_URL;

  const participant = useMemo(() => getParticipantMeta(), []);

  const [group, setGroup] = useState<GroupId>(
    () =>
      (localStorage.getItem("study-group") as GroupId) ||
      randGroup()
  );

  const [screen, setScreen] = useState<Screen>(
    dev ? "dev" : "instructions"
  );

  const [turn, setTurn] = useState(0);

  const [phase, setPhase] = useState<
    "typing" | "thinking" | "memory" | "response" | "ready"
  >("typing");

  const [typed, setTyped] = useState("");

  const [answers, setAnswers] = useState<Record<string, number>>({});

  const [results, setResults] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("study-results") || "[]");
    } catch {
      return [];
    }
  });

  const [attn, setAttn] = useState(
    () => Math.floor(Math.random() * 7) + 1
  );

  const [attnPosition, setAttnPosition] = useState(
    () => Math.floor(Math.random() * (surveyItems.length + 1))
  );

  const [questionIndex, setQuestionIndex] = useState(0);

  useEffect(() => {
    localStorage.setItem("study-group", group);
  }, [group]);

  useEffect(() => {
    localStorage.setItem("study-results", JSON.stringify(results));
  }, [results]);

  const assignment = (bank.rotation_groups as any)[group][turn];

  const transcript = useMemo(
    () =>
      (bank.transcripts as Transcript[]).find(
        (t) => t.transcript_id === assignment.transcript_id
      )!,
    [assignment.transcript_id]
  );

  useEffect(() => {
    if (screen !== "interaction") return;

    setTyped("");
    setPhase("typing");

    let i = 0;

    let t1: number | undefined;
    let t2: number | undefined;
    let t3: number | undefined;

    const timer = window.setInterval(() => {
      i += 2;
      setTyped(transcript.user.slice(0, i));

      if (i >= transcript.user.length) {
        clearInterval(timer);

        setPhase("thinking");

        // 5 seconds after the user message finishes, show memory update.
        t1 = window.setTimeout(() => setPhase("memory"), 5000);

        // 5 seconds after memory update, show assistant response.
        t2 = window.setTimeout(() => setPhase("response"), 10000);

        t3 = window.setTimeout(() => setPhase("ready"), 10350);
      }
    }, 28);

    return () => {
      clearInterval(timer);

      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
      if (t3) clearTimeout(t3);
    };
  }, [screen, transcript.transcript_id]);

  const startSurvey = () => {
    setAnswers({});
    setAttn(Math.floor(Math.random() * 7) + 1);
    setAttnPosition(
      Math.floor(Math.random() * (surveyItems.length + 1))
    );
    setQuestionIndex(0);
    setScreen("survey");
  };

  const attentionItem = {
    id: "ATTN",
    text: `To show you are paying attention, select ${attn} — ${
      agree[attn - 1]
    }.`,
    labels: agree,
  };

  const questionSet = [...surveyItems];
  questionSet.splice(attnPosition, 0, attentionItem);

  const currentQ = questionSet[questionIndex];

  const selectAnswer = (v: number) => {
    setAnswers((a) => ({
      ...a,
      [currentQ.id]: v,
    }));
  };

  const nextQuestion = async () => {
    if (!answers[currentQ.id]) {
      alert("Please select an answer.");
      return;
    }

    if (questionIndex < questionSet.length - 1) {
      setQuestionIndex((i) => i + 1);
    } else {
      await submit(false);
    }
  };

  const submit = async (skip = false) => {
    const itemAnswers = skip
      ? { skipped_dev: true }
      : answers;

    const row = {
      participant_id: participant.participantId,
      prolific_pid: participant.prolificPid,
      prolific_study_id: participant.studyId,
      prolific_session_id: participant.sessionId,

      group,

      interaction_turn: assignment.interaction_turn,

      transcript_id: transcript.transcript_id,
      subtype_id: transcript.subtype_id,
      subtype_code: transcript.subtype_code,
      subtype_name: transcript.subtype_name,

      context_id: transcript.context_id,
      context: transcript.context,

      answers: itemAnswers,

      attention_target: attn,
      attention_answer: skip ? null : answers.ATTN,
      attention_correct: skip
        ? null
        : answers.ATTN === attn,

      timestamp: new Date().toISOString(),
    };

    const updated = [...results, row];

    setResults(updated);

    localStorage.setItem(
      "study-results",
      JSON.stringify(updated)
    );

    if (!skip) {
      if (!apiUrl) {
        console.error(
          "VITE_API_URL is not configured."
        );

        alert(
          "Your response could not be saved. Please try again."
        );

        return;
      }

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(row),
        });

        if (!response.ok) {
          throw new Error(
            `Server returned ${response.status}`
          );
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(
            "Server did not confirm that the response was saved."
          );
        }
      } catch (error) {
        console.error(
          "Failed to save response:",
          error
        );

        alert(
          "Your response could not be saved. Please try again."
        );

        return;
      }
    }

    if (turn === 14) {
      setScreen("done");
    } else {
      setTurn((t) => t + 1);
      setScreen("interaction");
    }
  };

  const skipSurvey = () => {
    void submit(true);
  };

  const download = () => {
    const b = new Blob(
      [
        JSON.stringify(
          {
            participant,
            group,
            results,
          },
          null,
          2
        ),
      ],
      {
        type: "application/json",
      }
    );

    const u = URL.createObjectURL(b);

    const a = document.createElement("a");

    a.href = u;
    a.download = `results-${participant.participantId}.json`;

    a.click();

    URL.revokeObjectURL(u);
  };

  if (screen === "dev") {
    return (
      <main className="center">
        <section className="card">
          <div className="eyebrow">DEV MODE</div>

          <h1>Select group</h1>

          <p>
            This screen appears only with{" "}
            <code>npm run dev</code>.
          </p>

          <div className="groups">
            {(
              ["G1", "G2", "G3", "G4"] as GroupId[]
            ).map((g) => (
              <button
                key={g}
                className={
                  g === group
                    ? "group active"
                    : "group"
                }
                onClick={() => setGroup(g)}
              >
                {g}
              </button>
            ))}
          </div>

          <button
            className="primary"
            onClick={() =>
              setScreen("instructions")
            }
          >
            Continue
          </button>
        </section>
      </main>
    );
  }

  if (screen === "instructions") {
    return (
      <main className="center">
        <section className="card">
          <div className="eyebrow">
            AI MEMORY STUDY
          </div>

          <h1>Instructions</h1>

          <p>
            You will see 15 short interactions
            between a user and an AI assistant. The
            user asks for advice in different areas
            of their life.
          </p>

          <p>
            In each interaction, the assistant saves
            one piece of information about the user
            to memory. After reading the
            interaction, you will answer questions
            about that memory.
          </p>

          <p>
            Please read each interaction carefully
            and answer based on your own judgment.
          </p>

          {dev && (
            <div className="devnote">
              <div>
                Dev group: <b>{group}</b>
              </div>

              <div>
                Participant ID:{" "}
                <b>
                  {participant.participantId}
                </b>
              </div>
            </div>
          )}

          <button
            className="primary"
            onClick={() =>
              setScreen("interaction")
            }
          >
            Start study
          </button>
        </section>
      </main>
    );
  }

  if (screen === "interaction") {
    return (
      <main className="chat">
        <header>
          <b>AI Assistant</b>
          <span>{turn + 1} / 15</span>
        </header>

        <section className="conversation">
          <div className="userrow">
            <div className="userbubble">
              {typed}

              <span
                className={
                  phase === "typing"
                    ? "cursor"
                    : "hidden"
                }
              >
                ▍
              </span>
            </div>
          </div>

          {[
            "thinking",
            "memory",
            "response",
            "ready",
          ].includes(phase) && (
            <div className="assistantrow">
              <div className="avatar">✦</div>

              <div className="assistantbody">
                {phase === "thinking" && (
                  <div className="thinking-line">
                    <span className="thinking">
                      <i></i>
                      <i></i>
                      <i></i>
                    </span>

                    <span>Thinking</span>
                  </div>
                )}

                {[
                  "memory",
                  "response",
                  "ready",
                ].includes(phase) && (
                  <div className="memory">
                    <b>Memory updated</b>

                    <div>
                      {transcript.memory_updated}
                    </div>
                  </div>
                )}

                {[
                  "response",
                  "ready",
                ].includes(phase) && (
                  <p>{transcript.assistant}</p>
                )}
              </div>
            </div>
          )}
        </section>

        {phase === "ready" && (
          <footer>
            <button
              className="primary"
              onClick={startSurvey}
            >
              Proceed to survey
            </button>
          </footer>
        )}
      </main>
    );
  }

  if (screen === "survey") {
    const qNumber = questionIndex + 1;
    const qTotal = questionSet.length;

    const progress =
      (qNumber / qTotal) * 100;

    return (
      <main className="survey-one">
        <div className="survey-top">
          <div className="eyebrow">
            INTERACTION {turn + 1} OF 15
          </div>

          <div className="survey-progress-label">
            Question {qNumber} of {qTotal}
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        <section className="question-card">
          <div className="memory mini">
            <b>Memory updated</b>

            <div>
              {transcript.memory_updated}
            </div>
          </div>

          <h2>
            <span className="qnum">
              {qNumber}.
            </span>{" "}
            {currentQ.text}
          </h2>

          <div className="scale scale-one">
            {currentQ.labels.map(
              (label, i) => {
                const n = i + 1;

                return (
                  <label
                    key={n}
                    className={
                      answers[currentQ.id] === n
                        ? "opt selected"
                        : "opt"
                    }
                  >
                    <input
                      type="radio"
                      name={currentQ.id}
                      checked={
                        answers[currentQ.id] === n
                      }
                      onChange={() =>
                        selectAnswer(n)
                      }
                    />

                    <span className="num">
                      {n}
                    </span>

                    <span>{label}</span>
                  </label>
                );
              }
            )}
          </div>

          <div className="question-actions">
            {dev && (
              <button
                className="secondary"
                onClick={skipSurvey}
              >
                Skip all (dev)
              </button>
            )}

            <button
              className="primary"
              onClick={nextQuestion}
            >
              {questionIndex ===
              questionSet.length - 1
                ? turn === 14
                  ? "Finish study"
                  : "Next interaction"
                : "Next"}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="center">
      <section className="card">
        <div className="eyebrow">
          COMPLETE
        </div>

        <h1>Thank you</h1>

        <p>
          You have completed all 15
          interactions.
        </p>

        {dev && (
          <>
            <p className="devnote">
              Participant ID:{" "}
              <b>
                {participant.participantId}
              </b>
            </p>

            <button
              className="secondary"
              onClick={download}
            >
              Download results JSON
            </button>
          </>
        )}
      </section>
    </main>
  );
}
