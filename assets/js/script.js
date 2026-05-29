function toggleThemeFiles() {
    const body = document.body;
    const themeIcon = document.getElementById("theme-icon");
    const themeText = document.getElementById("theme-text");
  
    body.classList.toggle("dark-theme");
    const isDark = body.classList.contains("dark-theme");
  
    if (isDark) {
      themeIcon.textContent = "light_mode";
      themeText.textContent = "Светлая тема";
    } else {
      themeIcon.textContent = "dark_mode";
      themeText.textContent = "Тёмная тема";
    }
  }
  
  const errorOutput = document.getElementById("error-output");
  const yamlOutput = document.getElementById("yaml-output");
  const outputActions = document.querySelector(".output-actions");
  const yamlLabel = document.getElementById("yaml-output-label");
  
  function showError(message) {
    errorOutput.textContent = message;
    errorOutput.style.display = "block";
    yamlOutput.style.display = "none";
    outputActions.style.display = "none";
    yamlLabel.style.display = "none";
  }
  
  function hideError() {
    errorOutput.style.display = "none";
  }
  
  function copyToClipboard(text, button) {
    const originalHTML = button.dataset.originalHtml;
    const tempInput = document.createElement("textarea");
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
  
    try {
      document.execCommand("copy");
      button.innerHTML = '<span class="button-icon-group"><span class="material-symbols-outlined">check</span> Скопировано!</span>';
      button.classList.add("copied");
  
      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.classList.remove("copied");
      }, 1500);
    } catch (err) {
      showError("Не удалось скопировать текст. Используйте Ctrl+C.");
      console.error("Ошибка при копировании:", err);
    } finally {
      document.body.removeChild(tempInput);
    }
  }
  
  function pasteFromClipboard(button) {
    const targetId = button.dataset.targetId;
    const inputField = document.getElementById(targetId);
  
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard
        .readText()
        .then((text) => {
          inputField.value = text;
          handleGenerate();
          const originalHTML = button.dataset.originalHtml;
          button.innerHTML = '<span class="button-icon-group"><span class="material-symbols-outlined">check</span> Вставлено!</span>';
          button.classList.add("copied");
  
          setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove("copied");
          }, 1000);
        })
        .catch((err) => {
          showError("Не удалось получить доступ к буферу обмена. Вставьте ключ вручную.");
        });
    } else {
      showError("Ваш браузер не поддерживает автоматическую вставку из буфера обмена.");
    }
  }
  
  function parseProxy(proxyUrl) {
    try {
      hideError();
  
      const isVless = proxyUrl.startsWith("vless://");
      const isHysteria2 = proxyUrl.startsWith("hysteria2://");
  
      if (!isVless && !isHysteria2) {
        throw new Error('Ключ должен начинаться с "vless://" или "hysteria2://"');
      }
  
      const protocol = isVless ? "vless" : "hysteria2";
      const parts = proxyUrl.split("#");
      const urlString = parts[0];
      let proxyName = parts[1] ? decodeURIComponent(parts[1]) : (isVless ? "VLESS" : "HYSTERIA2");
  
      const url = new URL(urlString);
      const userInfo = url.username; // UUID для vless, пароль для hysteria2
      const hostname = url.hostname;
      const port = url.port || (isVless ? "443" : "8443");
  
      if (!userInfo || !hostname) {
        throw new Error("Не удалось извлечь учетные данные или адрес сервера.");
      }
  
      const params = url.searchParams;
      const result = {
        protocol: protocol,
        name: proxyName,
        server: hostname,
        port: port,
        credentials: userInfo,
        sni: params.get("sni") || hostname,
        fp: params.get("fp") || "chrome"
      };
  
      if (isVless) {
        result.pbk = params.get("pbk") || "";
        result.sid = params.get("sid") || "";
        result.flow = params.get("flow") || "xtls-rprx-vision";
      } else if (isHysteria2) {
        result.obfs = params.get("obfs") || "";
        result.obfsPassword = params.get("obfs-password") || "";
        result.alpn = params.get("alpn") || "h3";
      }
  
      return result;
    } catch (error) {
      console.error("Ошибка парсинга:", error);
      showError("Ошибка парсинга ключа: " + error.message);
      return null;
    }
  }
  
  function generateYaml(data) {
    if (!data.credentials || !data.server || !data.port) {
      return showError("Недостаточно данных для генерации YAML.");
    }
  
    let proxyConfig = "";
  
    // Блок для VLESS
    if (data.protocol === "vless") {
      proxyConfig = `
  - name: "${data.name}"
    type: vless
    server: ${data.server}
    port: ${data.port}
    uuid: "${data.credentials}"
    flow: ${data.flow}
    network: tcp
    udp: true
    tls: true
    servername: "${data.sni}"
    reality-opts:
      public-key: "${data.pbk}"
      short-id: "${data.sid}"
    client-fingerprint: ${data.fp}`;
    } 
    // Блок для Hysteria2
    else if (data.protocol === "hysteria2") {
      let obfsConfig = "";
      if (data.obfs) {
          obfsConfig = `
    obfs: ${data.obfs}
    obfs-password: "${data.obfsPassword}"`;
      }
      proxyConfig = `
  - name: "${data.name}"
    type: hysteria2
    server: ${data.server}
    port: ${data.port}
    password: "${data.credentials}"
    sni: "${data.sni}"
    client-fingerprint: ${data.fp}
    alpn:
      - ${data.alpn}
    skip-cert-verify: false${obfsConfig}`;
    }
  
    const yamlTemplate = `mixed-port: 7890
allow-lan: false
tcp-concurrent: true
enable-process: true
find-process-mode: always
mode: rule
log-level: info
ipv6: false
keep-alive-interval: 30
unified-delay: true
profile:
  store-selected: true
  store-fake-ip: true
sniffer:
  enable: true
  force-dns-mapping: true
  parse-pure-ip: true
  override-destination: false
  sniff:
    HTTP:
      ports:
        - 80
        - 8080-8880
      override-destination: true
    TLS:
      ports:
        - 443
        - 8443
  skip-dst-address:
    - 0.0.0.0/8
    - 10.0.0.0/8
    - 127.0.0.0/8
    - 192.168.0.0/16
    - fc00::/7
tun:
  enable: true
  stack: gvisor
  auto-route: true
  auto-detect-interface: true
  dns-hijack:
    - any:53
    - tcp://any:53
  strict-route: true
dns:
  enable: true
  prefer-h3: false
  use-hosts: true
  use-system-hosts: true
  ipv6: false
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  default-nameserver:
    - 77.88.8.8
    - 94.140.14.14
  proxy-server-nameserver:
    - https://1.1.1.1/dns-query
    - https://8.8.8.8/dns-query
  nameserver:
    - https://1.1.1.1/dns-query
    - https://8.8.8.8/dns-query
    - https://94.140.14.14/dns-query
geodata-mode: true
geo-auto-update: true
geo-update-interval: 24

proxies:${proxyConfig}

proxy-groups:
  - name: "PROXY"
    type: select
    proxies:
      - "${data.name}"
      - "DIRECT"
        
rules:
  # Пропишите правила здесь
  - DOMAIN-SUFFIX,local,DIRECT
  - IP-CIDR,127.0.0.0/8,DIRECT
  - IP-CIDR,172.16.0.0/12,DIRECT
  - IP-CIDR,192.168.0.0/16,DIRECT
  - IP-CIDR,10.0.0.0/8,DIRECT
  - IP-CIDR,17.0.0.0/8,DIRECT
  - IP-CIDR,100.64.0.0/10,DIRECT

  - GEOSITE,category-ads-all,REJECT
  - GEOSITE,win-spy,REJECT

  - MATCH,DIRECT
  `;
    return yamlTemplate;
  }
  
  function downloadYaml() {
    const yamlContent = yamlOutput.value;
    if (!yamlContent) {
      showError("Нет данных для скачивания. Сначала сгенерируйте YAML.");
      return;
    }
  
    const blob = new Blob([yamlContent], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
  
    a.href = url;
    a.download = "proxy_config.yaml";
  
    document.body.appendChild(a);
    a.click();
  
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  function handleGenerate() {
    const proxyUrl = document.getElementById("proxy-input").value.trim();
    if (!proxyUrl) {
      showError("Пожалуйста, введите ключ VLESS или Hysteria2.");
      return;
    }
  
    const parsedData = parseProxy(proxyUrl);
    if (parsedData) {
      const yaml = generateYaml(parsedData);
      if (yaml) {
        yamlOutput.value = yaml.trim();
        yamlOutput.style.display = "block";
        outputActions.style.display = "flex";
        yamlLabel.style.display = "block";
      }
    }
  }
