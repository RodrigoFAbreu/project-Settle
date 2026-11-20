"""Release versioning for Settle.

Release-bearing commits on `main` trigger a release. This script derives the next semantic
version from Conventional Commit subjects. See container/README.md and
.workflow-controller/policy.json for the policy it implements.

Usage:
    release.py check-title TITLE   Validate a PR title and print its release impact.
    release.py next-version        Print the version to release for HEAD, or nothing
                                   if there are no release-bearing changes.

Only the standard library is used so the script runs on any runner without setup.
"""

from __future__ import annotations

import re
import subprocess
import sys
from dataclasses import dataclass
from enum import IntEnum

TYPES = (
    "feat",
    "fix",
    "perf",
    "refactor",
    "docs",
    "test",
    "build",
    "ci",
    "chore",
    "style",
    "revert",
)

SUBJECT_RE = re.compile(
    r"^(?P<type>[a-z]+)(?:\((?P<scope>[a-z0-9._/-]+)\))?(?P<breaking>!)?: (?P<description>\S.*)$"
)
GITHUB_MERGE_RE = re.compile(r"^Merge pull request #\d+ from ")
TAG_RE = re.compile(r"^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$")


class Bump(IntEnum):
    NONE = 0
    PATCH = 1
    MINOR = 2
    MAJOR = 3


@dataclass(frozen=True, order=True)
class Version:
    major: int
    minor: int
    patch: int

    @classmethod
    def parse_tag(cls, tag: str) -> Version | None:
        match = TAG_RE.match(tag)
        if match is None:
            return None
        return cls(*(int(part) for part in match.groups()))

    def bump(self, bump: Bump) -> Version:
        if bump is Bump.MAJOR:
            return Version(self.major + 1, 0, 0)
        if bump is Bump.MINOR:
            return Version(self.major, self.minor + 1, 0)
        return Version(self.major, self.minor, self.patch + 1)

    def __str__(self) -> str:
        return f"v{self.major}.{self.minor}.{self.patch}"


class InvalidTitle(ValueError):
    pass


def classify(subject: str) -> Bump:
    """Return the bump for a Conventional Commit subject, or raise InvalidTitle."""
    match = SUBJECT_RE.match(subject.strip())
    if match is None:
        raise InvalidTitle(
            f"not a Conventional Commit title: {subject!r} "
            "(expected 'type(optional-scope)!: description')"
        )
    if match["type"] not in TYPES:
        raise InvalidTitle(
            f"unknown type {match['type']!r}; allowed: {', '.join(TYPES)}"
        )
    if match["breaking"]:
        return Bump.MAJOR
    if match["type"] == "feat":
        return Bump.MINOR
    if match["type"] == "ci":
        return Bump.NONE
    return Bump.PATCH


def classify_lenient(subject: str) -> Bump:
    """Classify a commit already on main; non-conforming subjects count as patch.

    PR title validation is the gate. A non-conforming subject on main means that
    gate was bypassed; blocking every future release would be worse than a
    conservative patch bump, so warn and continue.
    """
    try:
        return classify(subject)
    except InvalidTitle as error:
        print(f"::warning::{error}; treating as patch", file=sys.stderr)
        return Bump.PATCH


def git(*args: str) -> str:
    return subprocess.run(
        ["git", *args], check=True, capture_output=True, text=True
    ).stdout


def latest_release() -> tuple[str, Version] | None:
    """Return the highest version tag reachable from HEAD."""
    tags = [
        (tag, version)
        for tag in git("tag", "--merged", "HEAD").split()
        if (version := Version.parse_tag(tag)) is not None
    ]
    return max(tags, key=lambda item: item[1], default=None)


def next_version() -> Version | None:
    """Return the version for HEAD, or None if nothing is unreleased.

    Normally exactly one commit (the squash-merged PR) is unreleased. If an
    earlier release run failed or was superseded, all unreleased commits are
    released together at HEAD with the highest bump among them.
    """
    latest = latest_release()
    if latest is None:
        base, revisions = Version(0, 0, 0), "HEAD"
    else:
        tag, base = latest
        revisions = f"{tag}..HEAD"
    fields = git("log", "-z", "--first-parent", "--format=%s%x00%b", revisions).split("\0")
    subjects = []
    for subject, body in zip(fields[::2], fields[1::2]):
        if GITHUB_MERGE_RE.match(subject) and body.strip():
            subject = body.strip().splitlines()[0]
        subjects.append(subject)
    impact = max((classify_lenient(subject) for subject in subjects), default=Bump.NONE)
    return base.bump(impact) if impact is not Bump.NONE else None


def main(argv: list[str]) -> int:
    if len(argv) == 2 and argv[0] == "check-title":
        try:
            bump = classify(argv[1])
        except InvalidTitle as error:
            print(f"error: {error}", file=sys.stderr)
            return 1
        print(f"Valid title. Release impact: {bump.name.lower()}")
        return 0
    if argv == ["next-version"]:
        version = next_version()
        if version is not None:
            print(version)
        return 0
    print(__doc__, file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
