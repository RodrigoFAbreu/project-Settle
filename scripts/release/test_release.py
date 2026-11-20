"""The release policy: which merged PR titles release what, from squash or merge commits."""
from pathlib import Path
import json
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
RELEASE = ROOT / "scripts/release/release.py"


def check_title(title):
    return subprocess.run(["python3", str(RELEASE), "check-title", title],
                          capture_output=True, text=True)


class TitleImpactTests(unittest.TestCase):
    def test_title_release_impacts(self):
        for title, impact in [("ci: workflow adjustment", "none"), ("docs: page update", "patch"),
                              ("fix(m6): receipt categories", "patch"), ("feat: new screen", "minor"),
                              ("feat!: new storage format", "major")]:
            with self.subTest(title=title):
                result = check_title(title)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertIn("Release impact: " + impact, result.stdout)

    def test_non_conventional_titles_are_refused(self):
        for title in ["milestone-6", "Fix things", "wip: ", "bogus: x"]:
            with self.subTest(title=title):
                self.assertNotEqual(check_title(title).returncode, 0)

    def test_policy_table_matches_the_script(self):
        table = json.loads((ROOT / ".workflow-controller/policy.json").read_text())["release"]["change_types"]
        for kind, impact in table.items():
            with self.subTest(type=kind):
                result = check_title(f"{kind}: something")
                self.assertIn("Release impact: " + impact, result.stdout)


class NextVersionTests(unittest.TestCase):
    def repository(self, directory):
        def git(*arguments):
            subprocess.run(["git", *arguments], cwd=directory, check=True, capture_output=True)
        git("init", "-b", "main")
        git("config", "user.name", "Fixture")
        git("config", "user.email", "fixture@example.invalid")
        git("config", "commit.gpgsign", "false")
        return git

    def next_version(self, directory):
        return subprocess.check_output(["python3", str(RELEASE), "next-version"],
                                       cwd=directory, text=True).strip()

    def test_squash_commits_release_by_their_pr_title(self):
        with tempfile.TemporaryDirectory() as temporary:
            git = self.repository(temporary)
            git("commit", "--allow-empty", "-m", "feat: initial")
            git("tag", "v1.0.0")
            git("commit", "--allow-empty", "-m", "ci: adjust workflow (#2)")
            self.assertEqual(self.next_version(temporary), "")
            git("commit", "--allow-empty", "-m", "fix(m6): receipt categories (#3)")
            self.assertEqual(self.next_version(temporary), "v1.0.1")
            git("commit", "--allow-empty", "-m", "feat: new screen (#4)")
            self.assertEqual(self.next_version(temporary), "v1.1.0")
            git("commit", "--allow-empty", "-m", "feat!: new storage (#5)")
            self.assertEqual(self.next_version(temporary), "v2.0.0")

    def test_github_merge_commits_use_the_pr_title_in_their_body(self):
        with tempfile.TemporaryDirectory() as temporary:
            git = self.repository(temporary)
            git("commit", "--allow-empty", "-m", "feat: initial")
            git("tag", "v0.7.0")
            git("commit", "--allow-empty", "-m", "Merge pull request #9 from someone/branch",
                "-m", "feat(m5): balances and settling up")
            self.assertEqual(self.next_version(temporary), "v0.8.0")

    def test_first_release_starts_from_zero(self):
        with tempfile.TemporaryDirectory() as temporary:
            git = self.repository(temporary)
            git("commit", "--allow-empty", "-m", "fix: first")
            self.assertEqual(self.next_version(temporary), "v0.0.1")


if __name__ == "__main__":
    unittest.main()
