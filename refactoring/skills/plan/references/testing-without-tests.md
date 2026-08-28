# Building a safety net where there is none

Feathers' dilemma, from *Working Effectively with Legacy Code*: to change code safely you need tests, and to add tests to legacy code you have to change it. Most modules that need a refactoring plan are in this position. The application will not start without the world around it, so end-to-end tests are out of reach, and everything inside is coupled to everything else, so unit tests are too.

The way out has two moves. Make the first changes so mechanical that they need no tests. Test at whatever boundary can actually be reached, and assert sameness rather than correctness.

## Ten ways to get a net

1. **Find the widest boundary that can be driven.** Not the unit and not the whole application: the module's entry point. A handler called with a request object, a job's `run`, a CLI's `main`, a function that takes a payload. Bypass the server, the scheduler and the framework bootstrap. The question is what is the smallest thing that can be called from a script, not how to start the application.

2. **Build a golden master, not unit tests.** Run the current code against a corpus of inputs and record every output. That recording is the oracle. After each refactoring step, run the same corpus and diff. Inputs come from production logs, a sample of the database, existing fixtures or seeded random generation. Ugly output is fine; the test asserts that it is the same, not that it is right. Characterisation tests pin bugs too, on purpose, because a bug fixed mid-refactoring is a behaviour change nobody can tell apart from a mistake.

3. **Sense the side effects at the edge.** Where the output is a database write, an email, an HTTP call or a file, capture it there: a transaction that is inspected and then rolled back, a recording HTTP client, a mailer wrapped to append to a list, a temporary directory. What went out is part of the golden master.

4. **Where there is no seam, make the smallest one.** The dependency-breaking moves in `catalogue.md` exist for this and are designed to be done without tests, because each is mechanical: Parameterize Constructor with a default, Extract Interface, Extract and Override Call, Subclass and Override Method, Replace Global Reference with Getter. Pick the one that changes the fewest lines. In dynamic languages a link seam is often free: `jest.mock`, `monkeypatch`, import substitution, with no code change at all.

5. **Fake the world at the process edge, not inside the code.** When the module reads the environment, a configuration file, the clock or a database at start-up, supply those from outside: a compose file for the database, a fixture configuration, a frozen clock through the seam from the previous point. Prefer changing the environment to changing the code.

6. **Lean on the compiler and the tools.** In a typed language a tool-driven rename, move or extract is behaviour-preserving by construction; prefer the IDE's refactorings to hand edits while the net is thin. Type check, lint and build are tests too. In dynamic languages, unused-import and undefined-name checks catch most botched moves.

7. **Snapshot state, not only output.** For a scripted scenario, dump the relevant tables before and after with the old code. After the refactoring, run the same scenario and diff the dumps. Cheap, and it catches ordering and side-effect changes that a return value hides.

8. **Prove the net can go red.** Deliberately break one line in the module and run the golden master. If nothing fails, the corpus does not cover that path, and the plan says so. Do this before trusting any of it.

9. **For the riskiest steps, run old and new side by side.** Call both, serve the old result, log any difference. Production traffic is the widest corpus there is. Use it when the recorded inputs are thin and the step touches the public surface.

10. **Where nothing can pin a behaviour, say so.** A written manual walkthrough, recorded in the plan as checked by hand only. Refactorings that rely on it are marked higher risk and go last, or onto the leave-alone list.

## What this does to the plan

The order changes. The first refactorings are the seam-creating moves from point 4, done blind, mechanically, compiler-checked, one commit each, and marked in the plan as running without a net. Then the characterisation tests go in, numbered T1 onwards, each naming the behaviour it pins and the boundary it drives it from. Only then do the refactorings that improve the module begin, each naming the tests it relies on.

The golden master corpus lives in the repository, beside the module's tests, with a short note on where each input came from and when it was recorded. Anything recorded from production is anonymised before it is committed: no patient, customer or employee data in a fixture, ever. In a regulated codebase this is not a preference; it is the line between a refactoring and an incident.

The step table in the plan carries a column for the net: which tests cover the step, or the word blind. A team reading the table sees at a glance which steps to review hardest.
