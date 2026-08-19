# Heading Jump Fix

[![GitHub release](https://img.shields.io/github/v/release/crossbeat461-a11y/k-tech-heading-jump-fix?style=for-the-badge&display_name=tag)](https://github.com/crossbeat461-a11y/k-tech-heading-jump-fix/releases/latest)
[![License: MIT](https://img.shields.io/github/license/crossbeat461-a11y/k-tech-heading-jump-fix?style=for-the-badge)](LICENSE)
[![Release](https://img.shields.io/github/actions/workflow/status/crossbeat461-a11y/k-tech-heading-jump-fix/release.yml?style=for-the-badge&label=Release)](https://github.com/crossbeat461-a11y/k-tech-heading-jump-fix/actions/workflows/release.yml)
![App 1.5.0+](https://img.shields.io/badge/App-1.5.0%2B-483699?style=for-the-badge)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/k_tech_studio)

**[English](#readme-en)** · **[日本語](#readme-ja)**

![Heading Jump Fix screenshot](./images/screenshot.png)

K-Tech Studio plugin that **auto-corrects scroll position** after heading jumps from the Outline, wikilinks, or link panes.

---

<a id="readme-en"></a>

## English

### Problem

In Live Preview, clicking a heading in the Outline (or a `[[note#heading]]` link) sometimes moves the cursor but **does not scroll** the editor to show that heading — especially on long notes or right after opening the app. This plugin performs that second correction automatically.

### What it fixes

- Outline sidebar: one click should scroll to the heading
- In-note `[[wikilink#heading]]` clicks
- Heading clicks in Outgoing links / Backlinks
- Duplicate headings: disambiguated by order in the outline
- Theme `scroll-behavior: smooth` missing the target
- Configurable retry delay, retry count (with backoff), and scroll-to-center

### What it does not fix

- General UI sluggishness (Electron/GPU, too many plugins)
- Dropbox or sync I/O delay
- Block references (`#^block`)
- Reading view heading clicks that are not links

### How to use

1. Install **Heading Jump Fix** from Community plugins and enable it
2. Open a long note
3. Click a heading in **Outline**, a `[[note#heading]]` link, or a heading in the link panes

**Settings** (plugin options):

| Setting | Default | Description |
|---------|---------|-------------|
| Enable plugin | ON | Master switch |
| Outline click fix | ON | Retry scroll after outline clicks |
| Wikilink click fix | ON | Retry scroll after `[[wikilink#heading]]` clicks |
| Link pane click fix | ON | Retry scroll after Outgoing links / Backlinks |
| Retry delay (ms) | 250 | Wait before correction |
| Retry count | 1 | Extra scroll passes (later passes wait longer) |
| Scroll heading to center | ON | Center the heading in the editor |
| Override theme scroll-behavior | ON | Instant editor scroll (ignore theme smooth-scroll) |
| Debug log | OFF | Jump details in the developer console |

**Command palette:** `Jump to heading at cursor line reliably` — scrolls to the heading that contains the current cursor line.

### Author

K-Tech Studio

### Support

[Buy Me a Coffee](https://buymeacoffee.com/k_tech_studio)

### Disclaimer (no warranty)

This software is provided **as is**, without warranty of any kind. The developer does not guarantee that it will work in every environment. Use at your own risk. See the [MIT License](LICENSE).

### License

MIT

---

<a id="readme-ja"></a>

<details open>
<summary><strong>日本語</strong></summary>

Live Preview でアウトラインや `[[ノート#見出し]]` をクリックしても、カーソルだけ動いて **スクロールが追従しない** ことがあります。2 回目のクリック相当をプラグインが自動で行います。

### 直すもの

- アウトライン 1 クリックでの見出しジャンプ
- 本文の `[[wikilink#見出し]]` クリック
- アウトゴーイングリンク / バックリンクの見出しクリック
- 同名見出し（アウトライン上の順序で区別）
- テーマのスムーズスクロールで見出しを外す問題
- リトライ遅延・回数（backoff）・中央揃えの設定

### 直さないもの

- 全体の UI ラグ
- Dropbox 同期遅延
- ブロック参照（`#^`）
- リンクではないリーディングビューの見出しクリック

### 使い方

1. コミュニティプラグインから **Heading Jump Fix** を入れて有効にする
2. 長いノートを開く
3. **アウトライン**、`[[ノート#見出し]]`、またはリンクペインから見出しをクリックする

**設定**（プラグイン設定）:

| 設定 | 初期値 | 説明 |
|------|--------|------|
| プラグインを有効化 | ON | 全体のスイッチ |
| アウトラインクリック補正 | ON | アウトラインクリック後にスクロールを再試行 |
| Wikilink クリック補正 | ON | `[[wikilink#見出し]]` のあとスクロールを再試行 |
| リンクペイン補正 | ON | アウトゴーイング / バックリンクの見出しクリック |
| リトライ遅延 (ms) | 250 | 補正までの待ち時間 |
| リトライ回数 | 1 | 追加のスクロール回数（後の回は待ち時間が増える） |
| 見出しを中央へ | ON | エディタの中央付近に見出しを置く |
| テーマの scroll-behavior を上書き | ON | エディタを即時スクロール |
| デバッグログ | OFF | 開発者コンソールにジャンプ詳細を出す |

**コマンドパレット:** `Jump to heading at cursor line reliably` — カーソル行を含む見出しまでスクロールします。

### 作者

K-Tech Studio

### サポート

[Buy Me a Coffee](https://buymeacoffee.com/k_tech_studio)

### 免責（無保証）

本ソフトウェアは **現状有姿（無保証）** で提供します。あらゆる環境での動作を保証しません。利用は自己責任です。詳細は [MIT ライセンス](LICENSE) を参照してください。

### ライセンス

MIT

</details>
