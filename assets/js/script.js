function toggleThemeFiles() {
  const body = document.body;
  const themeIcon = document.getElementById("theme-icon");
  const themeText = document.getElementById("theme-text");

  body.classList.toggle("dark-theme");
  const isDark = body.classList.contains("dark-theme");

  if (isDark) {
    themeIcon.textContent = "light_mode";
    themeText.textContent = "Светлая тема";
    // localStorage.setItem("theme", "dark");
  } else {
    themeIcon.textContent = "dark_mode";
    themeText.textContent = "Тёмная тема";
    // localStorage.setItem("theme", "light");
  }
}


document.addEventListener("DOMContentLoaded", () => {
  /*
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-theme");
    document.getElementById("theme-icon").textContent = "light_mode";
    document.getElementById("theme-text").textContent = "Светлая тема";
  }
  */
});


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

    button.innerHTML =
      '<span class="button-icon-group"><span class="material-symbols-outlined">check</span> Скопировано!</span>';
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
        button.innerHTML =
          '<span class="button-icon-group"><span class="material-symbols-outlined">check</span> Вставлено!</span>';
        button.classList.add("copied");

        setTimeout(() => {
          button.innerHTML = originalHTML;
          button.classList.remove("copied");
        }, 1000);
      })
      .catch((err) => {
        showError(
          "Не удалось получить доступ к буферу обмена. Вставьте ключ вручную."
        );
      });
  } else {
    showError(
      "Ваш браузер не поддерживает автоматическую вставку из буфера обмена."
    );
  }
}


const fieldsToExtract = [
  { key: "server", label: "server" },
  { key: "port", label: "port" },
  { key: "uuid", label: "uuid" },
  { key: "servername", label: "servername", queryParam: "sni" },
  { key: "public-key", label: "public-key", queryParam: "pbk" },
  { key: "short-id", label: "short-id", queryParam: "sid" },
  { key: "client-fingerprint", label: "client-fingerprint", queryParam: "fp" },
];

function parseVless(vlessUrl) {
  try {
    hideError();

    if (!vlessUrl.startsWith("vless://")) {
      throw new Error(
        'Некорректный формат: ключ должен начинаться с "vless://"'
      );
    }

    const urlWithoutHash = vlessUrl.split("#")[0];
    const url = new URL(urlWithoutHash);

    const userInfo = url.username;
    const hostname = url.hostname;
    const port = url.port || "443";

    if (!userInfo || !hostname) {
      throw new Error("Не удалось извлечь UUID или адрес сервера.");
    }

    const params = url.searchParams;

    const result = {};
    result.uuid = userInfo;
    result.server = hostname;
    result.port = port;

    fieldsToExtract.forEach((field) => {
      if (
        field.key === "server" ||
        field.key === "port" ||
        field.key === "uuid"
      ) {
        return;
      }

      if (field.queryParam) {
        const value = params.get(field.queryParam);
        if (value) {
          result[field.key] = value;
        }
      }
    });

    return result;
  } catch (error) {
    console.error("Ошибка парсинга VLESS:", error);
    showError("Ошибка парсинга VLESS ключа: " + error.message);
    return null;
  }
}

function generateYaml(data) {
  if (!data.uuid || !data.server || !data.port) {
    return showError(
      "Недостаточно данных для генерации YAML (нет UUID, сервера или порта)."
    );
  }

  const servername = data.servername || data.server;
  const publicKey = data["public-key"] || "";
  const shortId = data["short-id"] || "";
  const fingerprint = data["client-fingerprint"] || "chrome";

  const yamlTemplate = `proxies:
mixed-port: 7890
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

proxies:
  - name: "VLESS" # Имя профиля, можно изменить на свое.
    type: vless
    server:  # Адрес сервера, изменить на свой.
    port: # Порт, изменить на свой.
    uuid: "" # User ID, изменить на свой.
    flow: xtls-rprx-vision
    network: tcp
    udp: true
    tls: true
    servername: "" # SNI, изменить на свой.
    reality-opts:
      public-key: "" # Public Key, изменить на свой.
      short-id: "" # ShortID, изменить на свой.
    client-fingerprint:  # Fingerprint, изменить на свой.

proxy-groups:
  - name: "PROXY"
    type: select
    proxies:
      - "VLESS"
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
  a.download = "vless_config.yaml";

  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleGenerate() {
  const vlessUrl = document.getElementById("vless-input").value.trim();
  if (!vlessUrl) {
    showError("Пожалуйста, введите VLESS ключ.");
    return;
  }

  const parsedData = parseVless(vlessUrl);
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
