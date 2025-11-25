![Logo](https://raw.githubusercontent.com/rknbypass/blocked-domains-list/refs/heads/main/freeinternet.png)

## Что это?
Страница, которая преобразует VLESS-ключ в полностью готовый YAML-конфиг для использования в прокси-клиентах. Остается лишь прописать свои правила маршрутизации.

## Как пользоваться?
1. Открыть страницу [**тут**](https://rdf1337.xyz/tools/yaml-generator/) или [**тут**](https://rknbypass.github.io/yaml-generator) (если первая ссылка не открывается).
2. Вставить свой VLESS-ключ.
3. Скачать конфиг и импортировать в свой прокси-клиент.

## Как добавить правила маршрутизации?
В блок **rules** добавляем правила по принципу:  
- **Процессы** прописываются в формате: `- PROCESS-NAME,<process_name>.exe,PROXY`.  
- **IP-адреса** прописываются в формате: `- IP-CIDR,<ip_address>,PROXY`.  
- **Домены** прописываются в формате: `- DOMAIN-SUFFIX,<somedomain>,PROXY`.

Например:
```yaml
rules:
- PROCESS-NAME,Notion.exe,PROXY
- IP-CIDR,173.245.48.0/20,PROXY
- DOMAIN-SUFFIX,7tv.app,PROXY
```
