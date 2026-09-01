# 台北免費 Wi-Fi 熱點地圖

[English](README.md)

這是一個以行動裝置為優先的雙語地圖、附近熱點搜尋器、目錄與資料集總覽，呈現台北免費公共 Wi-Fi 熱點位置。

本網站是靜態的公開資料目錄，**不會**顯示即時可用性、連線速度、訊號強度、壅塞程度或網路品質。

## 資料來源

- 資料集：[臺北市公眾區免費無線上網熱點資料（新版）](https://data.taipei/dataset/detail?id=6aa6532d-652f-4c1b-814a-4646b75407af)
- 提供單位：臺北市政府資訊局
- 公布更新頻率：每半年一次
- 納入的範例檔案：`data/raw/wifi-hotspots/Taipei_Free_AP_總表1141218.csv`

瀏覽器不會直接呼叫臺北市開放資料。僅由本機腳本下載並將 CSV 轉換為：

```text
public/data/wifi-hotspots.json
public/data/wifi-summary.json
public/data/conversion-report.json
```

## 資料處理流程

安裝相依套件：

```bash
npm install
```

使用 `data/raw/wifi-hotspots/` 中已有的 CSV，或下載官方資源：

```bash
npm run data:fetch
npm run data:fetch -- --force
```

轉換最新的原始 CSV：

```bash
npm run data:convert
```

轉換指定的上傳 CSV：

```bash
node --import tsx scripts/convertWifiHotspots.ts "/path/to/Taipei_Free_AP_總表1141218.csv"
node --import tsx scripts/buildWifiSummary.ts
```

### 欄位對應

轉換器會將官方的中英文欄位對應到 `WifiHotspot` 模型，包括地點／機關 ID、熱點類型、名稱、業者、郵遞區號、城市、行政區、地址、WGS84 經緯度與雙語顯示欄位。空白的非必要字串會被省略。

### 座標驗證

座標會轉為數字，並依 `src/lib/wifi.ts` 定義的台北及鄰近地區寬鬆範圍分類為 `valid`、`missing` 或 `outlier`。缺失或離群的紀錄仍會保留在轉換報告與目錄資料中，但不會顯示為地圖標記。

### 台北市外紀錄

例如「新店區」的紀錄會保留，並標記為 `isTaipeiCity: false`。應用程式預設只顯示「台北市」；關閉該篩選條件後即可看到市外紀錄。

## 應用程式功能

- 為超過 3,000 個已列出熱點提供 OpenStreetMap 群集標記
- 預設繁體中文，可切換英文，並提供中文後備顯示
- 搜尋以及行政區、類型、機關、業者與僅限台北市篩選
- 瀏覽器地理定位，提供 300 公尺、500 公尺、1 公里與 2 公里範圍
- Haversine 距離排序與 Google 地圖目的地連結
- 分頁式熱點目錄
- 靜態資料集摘要卡片與分布圖表
- PWA 資訊清單與輕量 Service Worker 快取

儀表板僅描述資料集涵蓋範圍；不會推論歷史趨勢或服務品質。

## 開發

```bash
npm run dev
npm test
npm run build
npm run preview
```

## 部署

Vite 使用 GitHub Pages 基礎路徑 `/taipei-free-wifi-map/`。內附工作流程會建置並部署推送至 `main` 分支的內容。

預期網址：

```text
https://LEO0331.github.io/taipei-free-wifi-map/
```

若使用其他主機或儲存庫名稱，請更新 `vite.config.ts` 中的 `base`、資訊清單的 `start_url` 與 `scope`，以及 `public/sw.js` 中的 `BASE` 常數。

## 免責聲明

本網站依開放資料呈現公共 Wi-Fi 熱點位置，並不代表即時可用性、連線速度或訊號品質。實際服務狀態應以現場情況及官方公告為準。
