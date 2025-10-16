import { Octokit } from '@octokit/rest'

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

export interface GitHubPR {
  number: number
  title: string
  state: string
  html_url: string
  created_at: string
  updated_at: string
  user: {
    login: string
  }
  draft: boolean
}

export interface GitHubIssue {
  number: number
  title: string
  state: string
  html_url: string
  created_at: string
  updated_at: string
  labels: Array<{ name: string }>
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/)
  if (!match) return null
  return { owner: match[1], repo: match[2] }
}

export async function getOpenPRs(owner: string, repo: string): Promise<GitHubPR[]> {
  try {
    const { data } = await octokit.pulls.list({
      owner,
      repo,
      state: 'open',
      per_page: 50,
    })
    return data as GitHubPR[]
  } catch (error) {
    console.error('Error fetching PRs:', error)
    return []
  }
}

export async function getOpenIssues(owner: string, repo: string): Promise<GitHubIssue[]> {
  try {
    const { data } = await octokit.issues.listForRepo({
      owner,
      repo,
      state: 'open',
      per_page: 50,
    })
    // Filter out PRs (they're also returned as issues)
    return data.filter(issue => !issue.pull_request) as GitHubIssue[]
  } catch (error) {
    console.error('Error fetching issues:', error)
    return []
  }
}

export async function getRepoInfo(owner: string, repo: string) {
  try {
    const { data } = await octokit.repos.get({ owner, repo })
    return {
      description: data.description,
      stars: data.stargazers_count,
      language: data.language,
      topics: data.topics,
      homepage: data.homepage,
    }
  } catch (error) {
    console.error('Error fetching repo info:', error)
    return null
  }
}

export async function getRecentCommits(owner: string, repo: string, limit = 10) {
  try {
    const { data } = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: limit,
    })
    return data.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author?.name,
      date: commit.commit.author?.date,
      url: commit.html_url,
    }))
  } catch (error) {
    console.error('Error fetching commits:', error)
    return []
  }
}
