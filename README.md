<br />

<h1 align="center">omp-zoxide</h1>

<p align="center"><strong>Jump anywhere with zoxide, without leaving omp</strong></p>

<br />

`/z <keywords>` resolves a zoxide match and moves the whole session there via the built-in `/move`.

```text
❯ /z dotfiles
Moved to /home/rsc/.dotfiles
```

## Install

Requires omp 18.12+ and [zoxide](https://github.com/ajeetdsouza/zoxide) in `PATH`.

```sh
omp plugin install github:rstacruz/omp-zoxide
```

Pin a release:

```sh
omp plugin install github:rstacruz/omp-zoxide#v0.1.0
```

Restart omp after installing.

## Usage

- `/z <keywords>` — zoxide's best match, then `/move`.
- `/z` — opens omp's move overlay.
- `Tab` after `/z ` — zoxide matches.

TUI and RPC only; ACP input isn't intercepted yet. It never writes to the zoxide database, so only your shell's `cd` changes scores. If `pi-cmux` is also installed, its `/z` command is shadowed while this plugin owns the input.

## Development

```sh
bun install
bun run check
omp plugin link .
```
