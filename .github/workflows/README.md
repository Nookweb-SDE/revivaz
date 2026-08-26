# CI

`test.yml` é o gate: typecheck, testes e build. Roda em push/PR para `main`.

Deploy hoje é **manual** (build local → `docker save | ssh load` → `docker stack deploy`
no Contabo). Quando existir um workflow de deploy, ele precisa começar assim:

```yaml
jobs:
  test:
    uses: ./.github/workflows/test.yml
  deploy:
    needs: test          # ← sem isto, deploy sobe com teste vermelho
    ...
```
