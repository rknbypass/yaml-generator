![Logo](https://raw.githubusercontent.com/rknbypass/blocked-domains-list/refs/heads/main/freeinternet.png)

## Что это?
Страница, которая преобразует VLESS-ключ / Hysteria2-ключ в полностью готовый YAML-конфиг для использования в прокси-клиентах. Остается лишь прописать свои правила маршрутизации.

## Как пользоваться?
1. Открыть страницу [**тут**](https://rdf1337.xyz/tools/yaml-generator/) или [**тут**](https://rknbypass.github.io/yaml-generator) (если первая ссылка не открывается).
2. Вставить свой VLESS-ключ / Hysteria2-ключ.
3. Скачать конфиг и импортировать в свой прокси-клиент.

## Как добавить правила маршрутизации?
В блок **rules** добавляем правила по принципу:  
- **Процессы** прописываются в формате: `- PROCESS-NAME,<process_name>.exe,PROXY-NAME`.  
- **IP-адреса** прописываются в формате: `- IP-CIDR,<ip_address>,PROXY-NAME`.  
- **Домены** прописываются в формате: `- DOMAIN-SUFFIX,<somedomain>,PROXY-NAME`.

Например:
```yaml
rules:
- PROCESS-NAME,Notion.exe,PROXY-NAME
- IP-CIDR,173.245.48.0/20,PROXY-NAME
- DOMAIN-SUFFIX,7tv.app,PROXY-NAME
```
