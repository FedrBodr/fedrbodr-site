@/Users/d.fedorenko/.codex/RTK.md

## FedrBodr Website

Этот репозиторий — Project Home и основной код персонального сайта Дмитрия Федоренко.

- Repository: `/Users/d.fedorenko/IdeaProjects/fedrbodr/fedrbodr`
- Personal OS: `/Users/d.fedorenko/IdeaProjects/fedrbodr/fedrbodr-os`
- Control Hub: `/Users/d.fedorenko/IdeaProjects/fedrbodr/fedrbodr-control-hub`
- Control Hub project id: `fedrbodr-website`

Primary checkout используется для изучения проекта, обсуждений и планирования.
Изменения выполняются в отдельном task-specific worktree.

## Personal OS integration

Если подключён MCP `controlhub`:

1. Перед содержательной работой вызови:
   `get_project_context(project_id="fedrbodr-website")`.
4. Для каждого изменяющего вызова используй новый уникальный `idempotency_key`.
5. В checkpoint сохраняй только:
    - выполненное;
    - текущее состояние;
    - принятые решения;
    - блокировки и ожидания;
    - одно следующее действие;
    - текущий commit и путь репозитория.
6. Не копируй в checkpoint полный разговор, секреты, токены и персональные данные.

Если проект `fedrbodr-website` ещё не зарегистрирован в Control Hub, не создавай
его молча и не придумывай контекст. Сообщи владельцу, что требуется onboarding.

## Linear integration

Linear является источником статусов проектов и задач.

- Если работа связана с конкретной Linear Issue, прочитай её перед началом.
- После завершения обновляй связанную Issue и прикладывай проверяемый результат.
- Не создавай новые проекты, не меняй сроки, приоритет или статус всего проекта
  без явного решения владельца.
- Не создавай дубликаты задач и checkpoints.

## Development

Сохраняй существующую простую архитектуру статического сайта.

Перед завершением:

- запусти существующие тесты;
- проверь `git diff`;
- не добавляй `.idea`, секреты и локальные файлы;
- укажи, что изменено и как это проверено.