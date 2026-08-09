const { useState, useEffect, useRef, useCallback } = React;

// ---- ローカルストレージ用の簡易シム(window.storage互換) -------------------
// GitHub Pages等、通常のブラウザ環境で動かすための永続化レイヤー。
window.storage = {
  async get(key) {
    const v = localStorage.getItem(key);
    if (v == null) throw new Error("not found");
    return { key, value: v };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    return { key, value };
  },
};

// ---- アイコン(lucide-reactの代わりの簡易SVGアイコン) -----------------------
function IconNavigation({ size = 16, color = "currentColor", className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}
function IconAlert({ size = 16, color = "currentColor", className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function IconTrain({ size = 16, color = "currentColor", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="4" y="3" width="16" height="13" rx="3" />
      <circle cx="8.5" cy="12.5" r="1.2" fill={color} />
      <circle cx="15.5" cy="12.5" r="1.2" fill={color} />
      <path d="M7 20 5 22M17 20l2 2M9 16v3M15 16v3" />
    </svg>
  );
}
function IconX({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ---- 駅データ(プリセット) ------------------------------------------------
// 座標はおおよその駅舎位置。実際のGPS精度により誤差が出るため、
// 判定半径(STAMP_RADIUS_M)には余裕を持たせています。
const LINES = {
  函館本線: "#3A4F7A",
  室蘭本線: "#B5502E",
  千歳線: "#3C6E52",
  宗谷本線: "#6B4E8E",
  石北本線: "#B8923A",
  富良野線: "#A65C72",
  根室本線: "#8C5A3C",
  釧網本線: "#5C7A6E",
  江差線: "#5A6B7A",
  カスタム: "#4E8098",
};

const STATIONS = [
  { id: "sapporo", name: "札幌", region: "函館本線", lat: 43.0686, lng: 141.3508 },
  { id: "otaru", name: "小樽", region: "函館本線", lat: 43.1907, lng: 140.9947 },
  { id: "teine", name: "手稲", region: "函館本線", lat: 43.1201, lng: 141.2159 },
  { id: "ebetsu", name: "江別", region: "函館本線", lat: 43.1043, lng: 141.5433 },
  { id: "eniwa", name: "恵庭", region: "千歳線", lat: 42.9101, lng: 141.5766 },
  { id: "chitose", name: "千歳", region: "千歳線", lat: 42.8267, lng: 141.652 },
  { id: "shinchitose", name: "新千歳空港", region: "千歳線", lat: 42.7752, lng: 141.6832 },
  { id: "tomakomai", name: "苫小牧", region: "室蘭本線", lat: 42.6337, lng: 141.6041 },
  { id: "date-monbetsu", name: "伊達紋別", region: "室蘭本線", lat: 42.47, lng: 140.832 },
  { id: "higashi-muroran", name: "東室蘭", region: "室蘭本線", lat: 42.377, lng: 140.963 },
  { id: "muroran", name: "室蘭", region: "室蘭本線", lat: 42.3153, lng: 140.9736 },
  { id: "iwamizawa", name: "岩見沢", region: "函館本線", lat: 43.1962, lng: 141.7719 },
  { id: "takikawa", name: "滝川", region: "函館本線", lat: 43.5566, lng: 141.9084 },
  { id: "noboribetsu", name: "登別", region: "室蘭本線", lat: 42.4239, lng: 141.1072 },
  { id: "toya", name: "洞爺", region: "室蘭本線", lat: 42.5814, lng: 140.8367 },
  { id: "oshamambe", name: "長万部", region: "室蘭本線", lat: 42.5119, lng: 140.6459 },
  { id: "asahikawa", name: "旭川", region: "函館本線", lat: 43.7593, lng: 142.3563 },
  { id: "fukagawa", name: "深川", region: "函館本線", lat: 43.7222, lng: 142.0561 },
  { id: "biei", name: "美瑛", region: "富良野線", lat: 43.5942, lng: 142.4636 },
  { id: "kamikawa", name: "上川", region: "石北本線", lat: 43.8467, lng: 142.8163 },
  { id: "shibetsu", name: "士別", region: "宗谷本線", lat: 44.1858, lng: 142.3853 },
  { id: "nayoro", name: "名寄", region: "宗谷本線", lat: 44.3559, lng: 142.4611 },
  { id: "wakkanai", name: "稚内", region: "宗谷本線", lat: 45.4153, lng: 141.6733 },
  { id: "furano", name: "富良野", region: "富良野線", lat: 43.3428, lng: 142.3822 },
  { id: "obihiro", name: "帯広", region: "根室本線", lat: 42.9153, lng: 143.1956 },
  { id: "kushiro", name: "釧路", region: "根室本線", lat: 42.985, lng: 144.382 },
  { id: "shibecha", name: "標茶", region: "釧網本線", lat: 43.1339, lng: 144.4818 },
  { id: "mashu", name: "摩周", region: "釧網本線", lat: 43.5928, lng: 144.5992 },
  { id: "abashiri", name: "網走", region: "石北本線", lat: 44.0211, lng: 144.2738 },
  { id: "kitami", name: "北見", region: "石北本線", lat: 43.8039, lng: 143.889 },
  { id: "akkeshi", name: "厚岸", region: "根室本線", lat: 43.045, lng: 144.8517 },
  { id: "shinhakodatehokuto", name: "新函館北斗", region: "函館本線", lat: 41.9061, lng: 140.6472 },
  { id: "goryokaku", name: "五稜郭", region: "函館本線", lat: 41.7975, lng: 140.7422 },
  { id: "onumakoen", name: "大沼公園", region: "函館本線", lat: 41.9765, lng: 140.6772 },
  { id: "mori", name: "森", region: "函館本線", lat: 42.1094, lng: 140.5992 },
  { id: "hakodate", name: "函館", region: "函館本線", lat: 41.7737, lng: 140.7261 },
  { id: "kikonai", name: "木古内", region: "江差線", lat: 41.6875, lng: 140.4267 },
];

const STAMP_RADIUS_M = 500; // この距離以内でスタンプ可能
const STORAGE_KEY = "hokkaido-stampbook:data";

// ---- ユーティリティ ---------------------------------------------------
function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(m) {
  if (m == null) return "—";
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

function formatStampDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(iso) {
  const d = new Date(iso);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
}

function hashRotation(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) % 1000;
  }
  return (h % 27) - 13; // -13 〜 13度
}

function polarPoint(r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) };
}

// ---- 硬券スタンプ本体(SVG) ------------------------------------------
function StampMark({ uid, name, dateLabel, rotation }) {
  const arcId = `arc-${uid}`;
  const filterId = `ink-${uid}`;
  const ticks = Array.from({ length: 16 }, (_, i) => i * (360 / 16));

  return (
    <div className="stamp-mark-wrap" style={{ transform: `rotate(${rotation}deg)` }}>
      <svg viewBox="0 0 100 100" width="74" height="74">
        <defs>
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves="2"
              seed={Math.abs(rotation) + 3}
              result="noise"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.6" />
          </filter>
          <path id={arcId} d="M14,54 A38,38 0 0 1 86,54" fill="none" />
        </defs>
        <g filter={`url(#${filterId})`} fill="none" stroke="#BC3B2E">
          <circle cx="50" cy="50" r="45" strokeWidth="2.4" />
          <circle cx="50" cy="50" r="37" strokeWidth="1" />
          {ticks.map((angle, i) => {
            const p1 = polarPoint(41, angle);
            const p2 = polarPoint(44.5, angle);
            return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} strokeWidth="1" />;
          })}
        </g>
        <text fill="#BC3B2E" fontSize="9.5" fontFamily="'Shippori Mincho', serif" filter={`url(#${filterId})`}>
          <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
            {name}
          </textPath>
        </text>
        <text
          x="50"
          y="55"
          textAnchor="middle"
          fontFamily="'Zen Kaku Gothic New', sans-serif"
          fontSize="8"
          fill="#BC3B2E"
          filter={`url(#${filterId})`}
        >
          下車済
        </text>
        <text
          x="50"
          y="67"
          textAnchor="middle"
          fontFamily="'Zen Kaku Gothic New', sans-serif"
          fontSize="5.5"
          fill="#BC3B2E"
          filter={`url(#${filterId})`}
        >
          {dateLabel}
        </text>
      </svg>
    </div>
  );
}

// ---- きっぷカード(未収集/収集済で共通利用) --------------------------------
function TicketCard({ station, onDelete, onStamp }) {
  const s = station;
  const inRange = s.distance != null && s.distance <= STAMP_RADIUS_M;

  if (s.stamp) {
    return (
      <div className="ticket ticket--stamped">
        {s.isCustom && (
          <button className="delete-btn" onClick={() => onDelete(s.id)}>
            <IconX size={12} />
          </button>
        )}
        <div className="ticket-stub" />
        <div className="ticket-body">
          <div className="ticket-main">
            <span className="region-chip" style={{ background: LINES[s.region] }}>
              {s.region}
            </span>
            <div className="station-name">{s.name}</div>
          </div>
          <div className="ticket-side">
            <div className="geo-mono" style={{ fontSize: 10.5 }}>
              {formatStampDate(s.stamp.stampedAt)}
            </div>
          </div>
        </div>
        <div className="punch-hole" />
        <StampMark
          uid={s.id}
          name={s.name}
          dateLabel={formatShortDate(s.stamp.stampedAt)}
          rotation={hashRotation(s.id)}
        />
      </div>
    );
  }

  return (
    <div className="ticket">
      {s.isCustom && (
        <button className="delete-btn" onClick={() => onDelete(s.id)}>
          <IconX size={12} />
        </button>
      )}
      <div className="ticket-stub" />
      <div className="ticket-body">
        <div className="ticket-main">
          <span className="region-chip" style={{ background: LINES[s.region] }}>
            {s.region}
          </span>
          <div className="station-name">{s.name}</div>
        </div>
        <div className="ticket-side">
          <div className="distance-readout">{formatDistance(s.distance)}</div>
          {inRange ? (
            <>
              <div className="in-range-tag">圏内</div>
              <button className="stamp-btn" onClick={() => onStamp(s, s.distance)}>
                スタンプを押す
              </button>
            </>
          ) : (
            <div className="in-range-tag" style={{ color: "#A79C82" }}>
              —
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StationStampBook() {
  const [stamps, setStamps] = useState({}); // { [stationId]: { stampedAt, lat, lng } }
  const [customStations, setCustomStations] = useState([]); // 自分で追加した駅・地点
  const [storageState, setStorageState] = useState("loading"); // loading | ready | error
  const [position, setPosition] = useState(null); // { lat, lng, accuracy }
  const [geoStatus, setGeoStatus] = useState("idle"); // idle | watching | denied | error | unsupported | timeout
  const [showDemo, setShowDemo] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const watchIdRef = useRef(null);
  const positionRef = useRef(null);

  // 保存データの読み込み
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY, false);
        if (!cancelled) {
          const parsed = result ? JSON.parse(result.value) : { stamps: {}, customStations: [] };
          setStamps(parsed.stamps || {});
          setCustomStations(parsed.customStations || []);
          setStorageState("ready");
        }
      } catch (e) {
        if (!cancelled) {
          setStamps({});
          setCustomStations([]);
          setStorageState("ready"); // キー未作成時はエラーになるため空扱いで続行
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 位置情報の監視開始
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGeoStatus("unsupported");
      return;
    }
    setGeoStatus("watching");
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        positionRef.current = next;
        setPosition(next);
        setGeoStatus("watching");
      },
      (err) => {
        setGeoStatus(err.code === 1 ? "denied" : "error");
      },
      { enableHighAccuracy: true, maximumAge: 8000, timeout: 20000 }
    );
    const timeoutId = setTimeout(() => {
      if (!positionRef.current) {
        setGeoStatus((cur) => (cur === "watching" ? "timeout" : cur));
      }
    }, 12000);
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      clearTimeout(timeoutId);
    };
  }, []);

  const persist = useCallback(async (stampsObj, customArr) => {
    try {
      await window.storage.set(
        STORAGE_KEY,
        JSON.stringify({ stamps: stampsObj, customStations: customArr }),
        false
      );
    } catch (e) {
      console.error("save failed", e);
    }
  }, []);

  const handleStamp = (station, distance) => {
    if (distance == null || distance > STAMP_RADIUS_M) return;
    const next = {
      ...stamps,
      [station.id]: {
        stampedAt: new Date().toISOString(),
        lat: position?.lat,
        lng: position?.lng,
      },
    };
    setStamps(next);
    persist(next, customStations);
  };

  const handleAddCustomStation = () => {
    if (!customName.trim()) return;
    let lat, lng;
    if (manualMode) {
      lat = parseFloat(manualLat);
      lng = parseFloat(manualLng);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    } else {
      if (!position) return;
      lat = position.lat;
      lng = position.lng;
    }
    const id = `custom-${Date.now()}`;
    const next = [
      ...customStations,
      {
        id,
        name: customName.trim(),
        region: "カスタム",
        lat,
        lng,
        isCustom: true,
      },
    ];
    setCustomStations(next);
    persist(stamps, next);
    setCustomName("");
    setManualLat("");
    setManualLng("");
    setShowAddForm(false);
  };

  const handleDeleteCustomStation = (id) => {
    if (!window.confirm("この地点を削除しますか?押したスタンプも消えます。")) return;
    const nextCustom = customStations.filter((c) => c.id !== id);
    const nextStamps = { ...stamps };
    delete nextStamps[id];
    setCustomStations(nextCustom);
    setStamps(nextStamps);
    persist(nextStamps, nextCustom);
  };

  const allStations = [...STATIONS, ...customStations];

  const enriched = allStations.map((s) => {
    const distance = position ? distanceMeters(position.lat, position.lng, s.lat, s.lng) : null;
    return { ...s, distance, stamp: stamps[s.id] || null };
  });

  const uncollected = enriched
    .filter((s) => !s.stamp)
    .sort((a, b) => {
      if (a.distance == null && b.distance == null) return 0;
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    });

  const collected = enriched
    .filter((s) => s.stamp)
    .sort((a, b) => new Date(b.stamp.stampedAt) - new Date(a.stamp.stampedAt));

  const collectedCount = collected.length;
  const total = allStations.length;

  return (
    <div className="page">
      <div className="container">
        <div className="header">
          <div className="header-titles">
            <h1>駅印帳</h1>
            <p>駅から{STAMP_RADIUS_M}m以内に近づくとスタンプが押せます。</p>
          </div>
          <div className="header-actions">
            <button className="demo-toggle" onClick={() => setShowDemo((v) => !v)}>
              {showDemo ? "サンプルを閉じる" : "スタンプ後のサンプルを見る"}
            </button>
            <button
              className="demo-toggle"
              onClick={() => {
                setShowAddForm((v) => !v);
                setShowDemo(false);
              }}
            >
              {showAddForm ? "閉じる" : "＋ 自分の駅を追加"}
            </button>
          </div>
          {showAddForm && (
            <div className="add-form">
              <input
                className="add-input"
                type="text"
                placeholder="駅・地点の名前(例: 散歩きっぷ 第1停留所)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
              {!manualMode && (
                <button
                  className="add-confirm"
                  disabled={!position || !customName.trim()}
                  onClick={handleAddCustomStation}
                >
                  現在地で登録
                </button>
              )}
              {!manualMode && !position && (
                <div className="add-hint">
                  現在地を取得中です。少し待ってから登録するか、下の「緯度経度を手動入力」をお試しください。
                </div>
              )}
              <button className="manual-toggle" onClick={() => setManualMode((v) => !v)}>
                {manualMode ? "現在地取得に戻す" : "緯度経度を手動入力する"}
              </button>
              {manualMode && (
                <div className="manual-fields">
                  <input
                    className="add-input manual-input"
                    type="text"
                    inputMode="decimal"
                    placeholder="緯度 例: 43.0686"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                  />
                  <input
                    className="add-input manual-input"
                    type="text"
                    inputMode="decimal"
                    placeholder="経度 例: 141.3508"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                  />
                  <button
                    className="add-confirm"
                    disabled={
                      !customName.trim() ||
                      Number.isNaN(parseFloat(manualLat)) ||
                      Number.isNaN(parseFloat(manualLng))
                    }
                    onClick={handleAddCustomStation}
                  >
                    この座標で登録
                  </button>
                  <div className="add-hint">
                    地図アプリで場所を長押しすると出てくる緯度経度をコピーして貼り付けられます。
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {showDemo && (
          <div className="ticket ticket--stamped demo-ticket">
            <div className="demo-ribbon">PREVIEW</div>
            <div className="ticket-stub" />
            <div className="ticket-body">
              <div className="ticket-main">
                <span className="region-chip" style={{ background: LINES["カスタム"] }}>
                  サンプル
                </span>
                <div className="station-name">サンプル駅</div>
              </div>
              <div className="ticket-side">
                <div className="geo-mono" style={{ fontSize: 10.5 }}>
                  2026/08/03 14:12
                </div>
              </div>
            </div>
            <div className="punch-hole" />
            <StampMark uid="demo" name="サンプル駅" dateLabel="26.08.03" rotation={6} />
          </div>
        )}

        <div className="progress-row">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${(collectedCount / total) * 100}%` }} />
          </div>
          <div className="progress-count">
            {collectedCount} / {total}
          </div>
        </div>

        {geoStatus === "watching" && (
          <div className="geo-card">
            <IconNavigation className="icon" size={16} color="#8B5E34" />
            <span className="geo-mono">
              {position
                ? `現在地取得中 (精度 ±${Math.round(position.accuracy)}m)`
                : "現在地を取得しています…"}
            </span>
          </div>
        )}
        {geoStatus === "timeout" && (
          <div className="geo-card warn">
            <IconAlert className="icon" size={16} color="#BC3B2E" />
            <span>
              位置情報の取得に時間がかかっています。端末の位置情報の許可設定をご確認いただくか、「＋
              自分の駅を追加」内の緯度経度を手動入力からお試しください。
            </span>
          </div>
        )}
        {geoStatus === "denied" && (
          <div className="geo-card warn">
            <IconAlert className="icon" size={16} color="#BC3B2E" />
            <span>位置情報が許可されていません。ブラウザの設定から位置情報を許可してください。</span>
          </div>
        )}
        {(geoStatus === "error" || geoStatus === "unsupported") && (
          <div className="geo-card warn">
            <IconAlert className="icon" size={16} color="#BC3B2E" />
            <span>位置情報を取得できませんでした。屋外で電波の良い場所でお試しください。</span>
          </div>
        )}

        <div className="sections">
          <div className="section-col">
            <div className="section-label">未収集・近い順</div>
            {uncollected.length === 0 ? (
              <div className="empty-note">すべての駅を収集しました。</div>
            ) : (
              <div className="tickets-grid">
                {uncollected.map((s) => (
                  <TicketCard
                    key={s.id}
                    station={s}
                    onDelete={handleDeleteCustomStation}
                    onStamp={handleStamp}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="section-col">
            <div className="section-label">収集済み</div>
            {collected.length === 0 ? (
              <div className="empty-note">まだ収集した駅はありません。</div>
            ) : (
              <div className="tickets-grid">
                {collected.map((s) => (
                  <TicketCard
                    key={s.id}
                    station={s}
                    onDelete={handleDeleteCustomStation}
                    onStamp={handleStamp}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="footnote">
          <IconTrain size={12} style={{ verticalAlign: "-1px", marginRight: 4 }} />
          駅座標はおおよその位置です。スマホのGPS精度により、実際に駅へ到着してもすぐに反映されない場合があります。データはこの端末にのみ保存されます。
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<StationStampBook />);
