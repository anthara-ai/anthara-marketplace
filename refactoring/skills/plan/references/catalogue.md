# From smell to refactoring

Which refactoring answers which smell, what the evidence for the smell looks like, the mechanics in a line, and when to leave the smell where it is. Names are Fowler's, from *Refactoring*, so the team can look up the full mechanics; the dependency-breaking moves at the end are Feathers', from *Working Effectively with Legacy Code*.

## Two reasons to refactor, and four to leave alone

Refactor when the code is on the path of a change someone needs to make, or when it is a hotspot paying interest. Nothing else qualifies, however it looks.

Leave alone when the code is stable and cold; when it is ugly but sits behind an interface nobody needs to change; when its behaviour is reached by reflection, serialisation or the schema and so cannot be pinned by a test; or when there is no seam and no way to characterise it, so the risk of the touch exceeds the benefit of the result.

## Long Function

**Looks like** a function that reads in paragraphs, with comments where the paragraph breaks are. **Evidence**: top of the X-ray list, deep indentation, a length far above the file's other functions.

**Refactor with** Extract Function, named for what the paragraph does rather than how. Mechanics: create the new function, copy the body, pass the locals it reads as parameters, return the ones it writes, replace the original lines with a call, test. Where extraction is blocked by temporaries, first Replace Temp with Query or Split Variable. Where it is blocked by a tangle of conditions, first Decompose Conditional or Replace Nested Conditional with Guard Clauses.

**Leave alone when** it is long but flat, stable and readable top to bottom. Sequence code, a builder that sets forty fields, is long by nature and gains nothing from forty functions.

## Large Class, and Divergent Change

**Looks like** one file changed for unrelated reasons. **Evidence**: the X-ray shows two clusters of functions that never share a commit; two vocabularies in one file; the frequency count is high and the coupling pairs point in two directions.

**Refactor with** Extract Class along the co-change seam. Mechanics: create the new class, Move Field one at a time, then Move Function one at a time, testing after each, then decide whether the old class holds a reference to the new one or callers reach it directly. Where the two halves run in sequence, parse then compute, use Split Phase instead: introduce an intermediate data structure, move the first phase's work behind it, then the second.

**Leave alone when** the size comes from many small cohesive methods with one reason to change. Large is not the smell; divergent is.

## Shotgun Surgery

**Looks like** one reason to change touching many files. **Evidence**: outside coupling above a third; the problem statement's trace hits several folders; a search for the discriminator finds the same switch in four places.

**Refactor with** Move Function and Move Field to bring the pieces together, then Combine Functions into Class when they share data, or Inline Function and Inline Class when the fragments are too small to be worth their own homes. When the same values travel between the fragments, Introduce Parameter Object. When the scattered pieces are all branches on the same kind, see Repeated Switches.

This is usually what "it's hard to add a new provider" turns out to be: each new provider today means a new case in a switch, a new entry in a config, a new branch in a factory and a new fixture in a test, in four files that have nothing in common but the provider.

**Leave alone when** the places that change together are already adjacent and the count is two.

## Repeated Switches

**Looks like** the same `switch` or `if` chain on the same discriminator in several places. **Evidence**: grep the discriminator; count the sites.

**Refactor with** Replace Conditional with Polymorphism when there are three or more sites. Mechanics: create a class per case, give the factory the job of choosing, move each branch into its class one case at a time, leave the switch's default in the base class until the last case moves, then remove it. Where the cases are data rather than behaviour, a lookup table keyed on the discriminator does the same with less ceremony. Replace Type Code with Subclasses where the discriminator is a field on the object itself.

**Leave alone when** there is one switch. Fowler's rule of three: the first duplicate is noted, the second is tolerated, the third is refactored. A single well-placed switch is the simplest design.

## Feature Envy

**Looks like** a function that spends its time reading another module's data. **Evidence**: more calls into one foreign object than into its own.

**Refactor with** Move Function, to where the data lives. Where only part of the function is envious, Extract Function first, then Move the extracted part.

**Leave alone when** the envy is the design: a strategy, a visitor, a reporter that reads many objects by intent.

## Data Clumps

**Looks like** the same three parameters travelling together through many signatures. **Evidence**: search for the parameter names appearing side by side.

**Refactor with** Introduce Parameter Object, then Preserve Whole Object at the call sites, then look for behaviour that wants to move onto the new object, which turns it into a class rather than a bag.

**Leave alone when** there are two callers.

## Primitive Obsession

**Looks like** a string or an integer standing in for a concept: a code system identifier as a bare string, a money amount as a float, a status as a magic number. **Evidence**: validation of the same string format repeated; the same constants compared in several files.

**Refactor with** Replace Primitive with Object. Mechanics: create the class with the primitive inside, Encapsulate Variable where the primitive is stored, change the setter to construct the object, then move the validation and the comparisons onto it. Replace Type Code with Subclasses when the primitive selects behaviour.

**Leave alone** at the serialisation edge. It arrives as a string and leaves as a string; the object lives between.

## Message Chains

**Looks like** `a.getB().getC().getD()`. **Evidence**: a change to `C` breaks callers who never asked for `C`.

**Refactor with** Hide Delegate on the object at the start of the chain, or Extract Function around the chain and Move Function it to where it belongs.

**Leave alone when** the chain is a fluent builder or a query pipeline, which are chains by design.

## Middle Man

**Looks like** a class whose every method delegates to one other object. **Refactor with** Remove Middle Man, or Inline Function one method at a time. Notice that this is the mirror of Hide Delegate; the two are tuned against each other, and the coupling data says which way to lean.

## Global Data and Mutable Data

**Looks like** module-level state, singletons, configuration or environment read deep inside a function, a variable written from several places. **Evidence**: tests that cannot run in parallel; order-dependent failures; a function whose result depends on what ran before it.

**Refactor with** Encapsulate Variable first, so every read and write goes through a function, which is also where a seam appears. Then Separate Query from Modifier where one function both reads and changes; Replace Derived Variable with Query where the state could be computed; Combine Functions into Transform where several functions enrich the same record.

**Leave alone when** the global is a constant. Constants are not mutable data, whatever their scope.

## Mysterious Name

**Looks like** a name that has to be read past to be understood. **Refactor with** Change Function Declaration, Rename Variable, Rename Field. These are the cheapest refactorings and the first to do; with tool support a rename is behaviour-preserving by construction, which makes it the one refactoring safe to do before any test exists.

**Leave alone when** the name is the domain's word and appears in logs, serialised output or the schema, where a rename is a behaviour change.

## Duplicated Code

**Looks like** the same lines in two places. **Evidence**: the two copies co-change, which the coupling data shows.

**Refactor with** Extract Function when the copies are in the same class; Slide Statements to bring them together first if they are not quite identical; Pull Up Method when they are in siblings.

**Leave alone when** the copies do not co-change. Two pieces of code that look alike and change for different reasons are coincidentally similar, and merging them couples two things that were free.

## Speculative Generality

**Looks like** an abstract class with one implementation, a hook nobody calls, a parameter every caller passes the same value for. **Evidence**: code age old, callers zero.

**Refactor with** Collapse Hierarchy, Inline Class, Inline Function, Remove Dead Code, Change Function Declaration to drop the parameter.

**Leave alone when** the problem statement is about to use it. An abstraction that has waited for its second implementation is not speculative once the second implementation is the point of the plan; make it real instead of removing it.

## Comments and Loops

A comment that explains what a block does is a function waiting for that name: Extract Function, named for the comment, then delete the comment. A loop that filters and maps by hand becomes a pipeline with Replace Loop with Pipeline. Do either only inside a hotspot; elsewhere it is taste.

## Dependency-breaking moves, for creating a seam without tests

These are the moves Feathers designed to be done blind, each mechanical enough for the compiler and a careful diff to be the only check. Pick the one that changes the fewest lines. Use the IDE where it offers the move. One commit each.

- **Parameterize Constructor** or **Parameterize Method**: accept the collaborator as an argument, with a default that constructs the old one. Every existing caller is untouched; a test passes a fake.
- **Extract Interface**: name the subset of a class that the code under test actually uses, and make the class implement it. A fake implements it too.
- **Extract and Override Call**, **Extract and Override Factory Method**, **Extract and Override Getter**: wrap the hard dependency in a method on the same class, then a test subclass overrides that one method.
- **Subclass and Override Method**: the general form of the above, for any method that reaches out.
- **Replace Global Reference with Getter**: put the global behind a method that a subclass can override.
- **Introduce Static Setter**: for a singleton, a way to swap the instance from a test. The last resort, and the plan marks it as one.
- **Adapt Parameter**: when a method takes a framework type that cannot be built in a test, wrap it in an interface the method actually needs.
- **Break Out Method Object**: when a long function reaches for everything in its class, move it into a class of its own with the pieces it needs as fields, so its parts can be tested and then extracted.
- **A link seam**: substituting a module at import time, with `jest.mock`, `monkeypatch` or the language's equivalent. No code change at all, which makes it the first choice where it exists.

## Ordering the steps

Renames and extracts first: they are the safest and the most tool-supported. Moves after extracts, because small things move more safely than large ones. Anything touching the public surface last, once every caller is ready for it. Anything that changes a serialised shape, a schema or a log line never, because it is not a refactoring.
