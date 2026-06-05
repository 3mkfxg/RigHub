/* =====================================================================
   PC COMPONENTS Storefront JS Logic - Real-Time Search & Compare Engine
   ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // STATE MANAGEMENT
    let allProducts = [];
    let filteredProducts = [];
    let comparedProducts = [];

    let currentPage = 1;
    const itemsPerPage = 12;

    let selectedCategory = "all";
    let selectedStores = ["iGeek.jo", "City Center", "Oriental Store", "PC Circle", "Taipei Computer", "MCC Jordan", "Game On Jordan"];
    let stockOnly = false;
    let searchQuery = "";
    let sortBy = "price-asc";

    let dataPriceMin = 0;
    let dataPriceMax = 2500;
    let currentFilterMin = 0;
    let currentFilterMax = 2500;

    // Active spec filters: Set of spec filter keys currently toggled ON
    let activeSpecFilters = new Set();

    // ---- SPEC FILTER DEFINITIONS PER CATEGORY ----
    // Each entry: { key, label, icon, match(product) } 
    const SPEC_FILTERS = {
        "Monitor": [
            { group: "Response Time", filters: [
                { key: "ms_0.1",  label: "0.1ms",  icon: "fa-bolt",  match: p => p.response_time && parseFloat(p.response_time) <= 0.1 },
                { key: "ms_0.2",  label: "0.2ms",  icon: "fa-bolt",  match: p => p.response_time && parseFloat(p.response_time) > 0.1  && parseFloat(p.response_time) <= 0.2 },
                { key: "ms_0.3",  label: "0.3ms",  icon: "fa-bolt",  match: p => p.response_time && parseFloat(p.response_time) > 0.2  && parseFloat(p.response_time) <= 0.3 },
                { key: "ms_0.5",  label: "0.5ms",  icon: "fa-bolt",  match: p => p.response_time && parseFloat(p.response_time) > 0.3  && parseFloat(p.response_time) <= 0.5 },
                { key: "ms_1",    label: "1ms",    icon: "fa-bolt",  match: p => p.response_time && parseFloat(p.response_time) > 0.5  && parseFloat(p.response_time) <= 1   },
                { key: "ms_2",    label: "2ms",    icon: "fa-bolt",  match: p => p.response_time && parseFloat(p.response_time) > 1    && parseFloat(p.response_time) <= 2   },
                { key: "ms_4",    label: "4ms",    icon: "fa-bolt",  match: p => p.response_time && parseFloat(p.response_time) > 2    && parseFloat(p.response_time) <= 4   },
                { key: "ms_5p",   label: "5ms+",   icon: "fa-bolt",  match: p => p.response_time && parseFloat(p.response_time) > 4   },
            ]},
            { group: "Screen Size", filters: [
                { key: "inch_21",  label: "21\"",  icon: "fa-expand",  match: p => p.screen_size && parseFloat(p.screen_size) >= 20.5 && parseFloat(p.screen_size) < 22   },
                { key: "inch_22",  label: "22\"",  icon: "fa-expand",  match: p => p.screen_size && parseFloat(p.screen_size) >= 22   && parseFloat(p.screen_size) < 23   },
                { key: "inch_23",  label: "23\"",  icon: "fa-expand",  match: p => p.screen_size && parseFloat(p.screen_size) >= 23   && parseFloat(p.screen_size) < 24   },
                { key: "inch_24",  label: "24\"",  icon: "fa-expand",  match: p => p.screen_size && parseFloat(p.screen_size) >= 24   && parseFloat(p.screen_size) < 25   },
                { key: "inch_25",  label: "25\"",  icon: "fa-expand",  match: p => p.screen_size && parseFloat(p.screen_size) >= 25   && parseFloat(p.screen_size) < 26   },
                { key: "inch_26",  label: "26\"",  icon: "fa-expand",  match: p => p.screen_size && parseFloat(p.screen_size) >= 26   && parseFloat(p.screen_size) < 27   },
                { key: "inch_27",  label: "27\"",  icon: "fa-expand",  match: p => p.screen_size && parseFloat(p.screen_size) >= 27   && parseFloat(p.screen_size) < 28   },
                { key: "inch_28",  label: "28\"",  icon: "fa-expand",  match: p => p.screen_size && parseFloat(p.screen_size) >= 28   && parseFloat(p.screen_size) < 29   },
                { key: "inch_29",  label: "29\"",  icon: "fa-expand",  match: p => p.screen_size && parseFloat(p.screen_size) >= 29   && parseFloat(p.screen_size) < 30   },
                { key: "inch_31",  label: "31\"",  icon: "fa-expand",  match: p => p.screen_size && parseFloat(p.screen_size) >= 30   && parseFloat(p.screen_size) < 32   },
                { key: "inch_32",  label: "32\"",  icon: "fa-expand",  match: p => p.screen_size && parseFloat(p.screen_size) >= 32   && parseFloat(p.screen_size) < 33.5 },
                { key: "inch_34",  label: "34\"",  icon: "fa-expand",  match: p => p.screen_size && parseFloat(p.screen_size) >= 33.5 && parseFloat(p.screen_size) < 36   },
                { key: "inch_38",  label: "38\"",  icon: "fa-expand",  match: p => p.screen_size && parseFloat(p.screen_size) >= 36   && parseFloat(p.screen_size) < 42   },
                { key: "inch_42",  label: "42\"",  icon: "fa-expand",  match: p => p.screen_size && parseFloat(p.screen_size) >= 42   && parseFloat(p.screen_size) < 45   },
                { key: "inch_45",  label: "45\"",  icon: "fa-expand",  match: p => p.screen_size && parseFloat(p.screen_size) >= 45   && parseFloat(p.screen_size) < 48   },
                { key: "inch_49",  label: "49\"",  icon: "fa-expand",  match: p => p.screen_size && parseFloat(p.screen_size) >= 48   && parseFloat(p.screen_size) < 52   },
                { key: "inch_57",  label: "57\"",  icon: "fa-expand",  match: p => p.screen_size && parseFloat(p.screen_size) >= 52   && parseFloat(p.screen_size) <= 60  },
            ]},
            { group: "Refresh Rate", filters: [
                { key: "hz_60",   label: "60Hz",   icon: "fa-gauge-high",  match: p => p.refresh_rate && parseInt(p.refresh_rate) === 60  },
                { key: "hz_75",   label: "75Hz",   icon: "fa-gauge-high",  match: p => p.refresh_rate && parseInt(p.refresh_rate) === 75  },
                { key: "hz_100",  label: "100Hz",  icon: "fa-gauge-high",  match: p => p.refresh_rate && parseInt(p.refresh_rate) === 100 },
                { key: "hz_120",  label: "120Hz",  icon: "fa-gauge-high",  match: p => p.refresh_rate && parseInt(p.refresh_rate) === 120 },
                { key: "hz_144",  label: "144Hz",  icon: "fa-gauge-high",  match: p => p.refresh_rate && parseInt(p.refresh_rate) === 144 },
                { key: "hz_165",  label: "165Hz",  icon: "fa-gauge-high",  match: p => p.refresh_rate && parseInt(p.refresh_rate) === 165 },
                { key: "hz_180",  label: "180Hz",  icon: "fa-gauge-high",  match: p => p.refresh_rate && parseInt(p.refresh_rate) === 180 },
                { key: "hz_240",  label: "240Hz",  icon: "fa-gauge-high",  match: p => p.refresh_rate && parseInt(p.refresh_rate) === 240 },
                { key: "hz_280",  label: "280Hz",  icon: "fa-gauge-high",  match: p => p.refresh_rate && parseInt(p.refresh_rate) === 280 },
                { key: "hz_360",  label: "360Hz",  icon: "fa-gauge-high",  match: p => p.refresh_rate && parseInt(p.refresh_rate) === 360 },
                { key: "hz_480",  label: "480Hz",  icon: "fa-gauge-high",  match: p => p.refresh_rate && parseInt(p.refresh_rate) === 480 },
                { key: "hz_500p", label: "500Hz+", icon: "fa-gauge-high",  match: p => p.refresh_rate && parseInt(p.refresh_rate) >= 500 },
            ]},
            { group: "Panel Type", filters: [
                { key: "panel_ips",   label: "IPS",   icon: "fa-layer-group", match: p => /\bips\b/i.test(p["Full Name"]) },
                { key: "panel_va",    label: "VA",    icon: "fa-layer-group", match: p => /\bva\b/i.test(p["Full Name"]) },
                { key: "panel_tn",    label: "TN",    icon: "fa-layer-group", match: p => /\btn\b/i.test(p["Full Name"]) },
                { key: "panel_oled",  label: "OLED",  icon: "fa-layer-group", match: p => /\boled\b/i.test(p["Full Name"]) },
                { key: "panel_qled",  label: "QLED",  icon: "fa-layer-group", match: p => /\bqled\b/i.test(p["Full Name"]) },
                { key: "panel_qd",    label: "QD-OLED",icon: "fa-layer-group",match: p => /qd.?oled/i.test(p["Full Name"]) },
                { key: "panel_nano",  label: "Nano IPS",icon: "fa-layer-group",match: p => /nano.?ips/i.test(p["Full Name"]) },
                { key: "panel_fast",  label: "Fast IPS",icon: "fa-layer-group",match: p => /fast.?ips/i.test(p["Full Name"]) },
            ]},
            { group: "Curve / Shape", filters: [
                { key: "shape_flat",   label: "Flat",   icon: "fa-minus",    match: p => /\bflat\b/i.test(p["Full Name"]) || !/curved|curve/i.test(p["Full Name"]) },
                { key: "shape_curved", label: "Curved", icon: "fa-circle-half-stroke", match: p => /curved|curve/i.test(p["Full Name"]) },
                { key: "shape_1000r",  label: "1000R",  icon: "fa-circle-half-stroke", match: p => /1000r/i.test(p["Full Name"]) },
                { key: "shape_1500r",  label: "1500R",  icon: "fa-circle-half-stroke", match: p => /1500r/i.test(p["Full Name"]) },
                { key: "shape_1800r",  label: "1800R",  icon: "fa-circle-half-stroke", match: p => /1800r/i.test(p["Full Name"]) },
            ]},
        ],
        "Monitor Arm": [
            { group: "Weight Capacity", filters: [
                { key: "wt_9",   label: "9kg",     icon: "fa-weight-hanging", match: p => { const w = parseFloat(String(p.weight_support||"")); return w >= 9; } },
                { key: "wt_12",  label: "12kg+",   icon: "fa-weight-hanging", match: p => { const w = parseFloat(String(p.weight_support||"")); return w >= 12; } },
            ]},
            { group: "Arm Type", filters: [
                { key: "arm_single", label: "Single Arm", icon: "fa-circle-nodes", match: p => p.arms_supported == 1 },
                { key: "arm_dual",   label: "Dual Arm",   icon: "fa-circle-nodes", match: p => p.arms_supported == 2 },
            ]},
        ],
        "GPU": [
            { group: "Brand / Chipset", filters: [
                { key: "gpu_nv_rtx50", label: "NVIDIA RTX 50-Series", icon: "fa-server", match: p => /rtx\s*50\d\d|rtx\s*50-series/i.test(p["Full Name"]) },
                { key: "gpu_nv_rtx40", label: "NVIDIA RTX 40-Series", icon: "fa-server", match: p => /rtx\s*40\d\d|rtx\s*40-series/i.test(p["Full Name"]) },
                { key: "gpu_nv_rtx30", label: "NVIDIA RTX 30-Series", icon: "fa-server", match: p => /rtx\s*30\d\d|rtx\s*30-series/i.test(p["Full Name"]) },
                { key: "gpu_amd_rx",   label: "AMD Radeon RX",        icon: "fa-server", match: p => /\brx\s*\d{4}\b/i.test(p["Full Name"]) },
            ]},
            { group: "VRAM", filters: [
                { key: "vram_6",   label: "6GB VRAM",  icon: "fa-server", match: p => /\b6\s*gb/i.test(p["Full Name"]) },
                { key: "vram_8",   label: "8GB VRAM",  icon: "fa-server", match: p => /\b8\s*gb/i.test(p["Full Name"]) },
                { key: "vram_12",  label: "12GB VRAM", icon: "fa-server", match: p => /\b12\s*gb/i.test(p["Full Name"]) },
                { key: "vram_16",  label: "16GB VRAM", icon: "fa-server", match: p => /\b16\s*gb/i.test(p["Full Name"]) },
                { key: "vram_24",  label: "24GB VRAM", icon: "fa-server", match: p => /\b24\s*gb/i.test(p["Full Name"]) },
            ]},
        ],
        "Processor": [
            { group: "Series", filters: [
                { key: "cpu_i3", label: "Core i3", icon: "fa-microchip", match: p => /\bi3\b/i.test(p["Full Name"]) },
                { key: "cpu_i5", label: "Core i5", icon: "fa-microchip", match: p => /\bi5\b/i.test(p["Full Name"]) },
                { key: "cpu_i7", label: "Core i7", icon: "fa-microchip", match: p => /\bi7\b/i.test(p["Full Name"]) },
                { key: "cpu_i9", label: "Core i9", icon: "fa-microchip", match: p => /\bi9\b/i.test(p["Full Name"]) },
                { key: "cpu_r3", label: "Ryzen 3", icon: "fa-microchip", match: p => /ryzen\s*3/i.test(p["Full Name"]) },
                { key: "cpu_r5", label: "Ryzen 5", icon: "fa-microchip", match: p => /ryzen\s*5/i.test(p["Full Name"]) },
                { key: "cpu_r7", label: "Ryzen 7", icon: "fa-microchip", match: p => /ryzen\s*7/i.test(p["Full Name"]) },
                { key: "cpu_r9", label: "Ryzen 9", icon: "fa-microchip", match: p => /ryzen\s*9/i.test(p["Full Name"]) },
                { key: "cpu_tr", label: "Threadripper", icon: "fa-microchip", match: p => /threadripper/i.test(p["Full Name"]) },
            ]},
            { group: "Clock Speed", filters: [
                { key: "ghz_3.5", label: "3.5GHz+", icon: "fa-gauge-high", match: p => /3\.[5-9]ghz|[4-9]\.[0-9]ghz/i.test(p["Full Name"]) },
                { key: "ghz_5.0", label: "5.0GHz+", icon: "fa-gauge-high", match: p => /5\.[0-9]ghz|[6-9]\.[0-9]ghz/i.test(p["Full Name"]) },
            ]},
        ],
        "SSD": [
            { group: "Capacity", filters: [
                { key: "ssd_250",  label: "250GB",  icon: "fa-database", match: p => /250gb|256gb/i.test(p["Full Name"]) },
                { key: "ssd_500",  label: "500GB",  icon: "fa-database", match: p => /500gb|512gb/i.test(p["Full Name"]) },
                { key: "ssd_1tb",  label: "1TB",    icon: "fa-database", match: p => /\b1\s*tb\b/i.test(p["Full Name"]) },
                { key: "ssd_2tb",  label: "2TB",    icon: "fa-database", match: p => /\b2\s*tb\b/i.test(p["Full Name"]) },
                { key: "ssd_4tb",  label: "4TB",    icon: "fa-database", match: p => /\b4\s*tb\b/i.test(p["Full Name"]) },
            ]},
        ],
        "Hard Disk": [
            { group: "Capacity", filters: [
                { key: "hdd_500",  label: "500GB",  icon: "fa-hdd", match: p => /500gb|512gb/i.test(p["Full Name"]) },
                { key: "hdd_1tb",  label: "1TB",    icon: "fa-hdd", match: p => /\b1\s*tb\b/i.test(p["Full Name"]) },
                { key: "hdd_2tb",  label: "2TB",    icon: "fa-hdd", match: p => /\b2\s*tb\b/i.test(p["Full Name"]) },
                { key: "hdd_4tb",  label: "4TB",    icon: "fa-hdd", match: p => /\b4\s*tb\b/i.test(p["Full Name"]) },
            ]},
        ],
        "PSU": [
            { group: "Wattage", filters: [
                { key: "psu_sub550", label: "Under 550W", icon: "fa-plug", match: p => {
                    const m = p["Full Name"].match(/\b(\d{3,4})\s*w\b/i);
                    return m && parseInt(m[1]) < 550;
                }},
                { key: "psu_550", label: "550W - 650W", icon: "fa-plug", match: p => {
                    const m = p["Full Name"].match(/\b(\d{3,4})\s*w\b/i);
                    return m && (parseInt(m[1]) >= 550 && parseInt(m[1]) <= 650);
                }},
                { key: "psu_750", label: "700W - 850W", icon: "fa-plug", match: p => {
                    const m = p["Full Name"].match(/\b(\d{3,4})\s*w\b/i);
                    return m && (parseInt(m[1]) >= 700 && parseInt(m[1]) <= 850);
                }},
                { key: "psu_1000", label: "1000W+", icon: "fa-plug", match: p => {
                    const m = p["Full Name"].match(/\b(\d{3,4})\s*w\b/i);
                    return m && parseInt(m[1]) >= 1000;
                }},
            ]},
            { group: "Certification", filters: [
                { key: "psu_bronze",   label: "80+ Bronze",   icon: "fa-medal", match: p => /bronze/i.test(p["Full Name"]) },
                { key: "psu_gold",     label: "80+ Gold",     icon: "fa-medal", match: p => /gold/i.test(p["Full Name"]) },
                { key: "psu_platinum", label: "80+ Platinum / Titanium", icon: "fa-medal", match: p => /platinum|titanium/i.test(p["Full Name"]) },
            ]},
            { group: "Modularity", filters: [
                { key: "psu_modular", label: "Fully Modular", icon: "fa-circle-nodes", match: p => /fully\s*modular|full\s*modular/i.test(p["Full Name"]) },
                { key: "psu_semi",    label: "Semi / Non-Modular", icon: "fa-circle", match: p => !/fully\s*modular|full\s*modular/i.test(p["Full Name"]) },
            ]},
        ],
        "Controllers": [
            { group: "Platform", filters: [
                { key: "ctrl_xboxsx",  label: "Xbox Series X/S", icon: "fa-gamepad", match: p => /xbox.series/i.test(p["Full Name"]) },
                { key: "ctrl_xboxone", label: "Xbox One",       icon: "fa-gamepad", match: p => /xbox.one/i.test(p["Full Name"]) },
                { key: "ctrl_ps4",     label: "PS4",            icon: "fa-gamepad", match: p => /ps4|dualshock/i.test(p["Full Name"]) },
                { key: "ctrl_ps5",     label: "PS5",            icon: "fa-gamepad", match: p => /ps5|dualsense/i.test(p["Full Name"]) },
            ]},
        ],
        "Peripherals": [
            { group: "Device Type", filters: [
                { key: "peri_mouse",    label: "Mouse",    icon: "fa-computer-mouse", match: p => /mouse|mice/i.test(p["Full Name"]) },
                { key: "peri_keyboard", label: "Keyboard", icon: "fa-keyboard",       match: p => /keyboard/i.test(p["Full Name"]) },
                { key: "peri_headset",  label: "Headset",  icon: "fa-headphones",     match: p => /headset/i.test(p["Full Name"]) },
            ]},
        ],
        "Audio Gear": [
            { group: "Device Type", filters: [
                { key: "audio_headset",   label: "Headset",    icon: "fa-headphones",    match: p => /headset/i.test(p["Full Name"]) },
                { key: "audio_earphone",  label: "Earphones",  icon: "fa-headphones",    match: p => /earphone|earbud|in.ear/i.test(p["Full Name"]) },
            ]},
        ],
        "Webcams": [
            { group: "Resolution", filters: [
                { key: "cam_1080", label: "1080p",  icon: "fa-video", match: p => /1080/i.test(p["Full Name"]) },
                { key: "cam_4k",   label: "4K",     icon: "fa-video", match: p => /4k|2160/i.test(p["Full Name"]) },
            ]},
            { group: "Frame Rate", filters: [
                { key: "cam_60fps",  label: "60fps",  icon: "fa-film", match: p => /60fps|60 fps/i.test(p["Full Name"]) },
                { key: "cam_120fps", label: "120fps", icon: "fa-film", match: p => /120fps|120 fps/i.test(p["Full Name"]) },
            ]},
        ],
        "Thermal Paste": [
            { group: "Type", filters: [
                { key: "paste_grease", label: "Thermal Paste", icon: "fa-temperature-half", match: p => /paste|grease|compound/i.test(p["Full Name"]) },
                { key: "paste_metal",  label: "Liquid Metal",  icon: "fa-droplet",          match: p => /liquid.metal|conductonaut/i.test(p["Full Name"]) },
                { key: "paste_pad",    label: "Thermal Pad",   icon: "fa-square",           match: p => /pad/i.test(p["Full Name"]) },
            ]}
        ],
        "Laptop": [
            { group: "Processor", filters: [
                { key: "laptop_cpu_i5", label: "Intel Core i5", icon: "fa-microchip", match: p => /i5\b/i.test(p["Full Name"]) },
                { key: "laptop_cpu_i7", label: "Intel Core i7", icon: "fa-microchip", match: p => /i7\b/i.test(p["Full Name"]) },
                { key: "laptop_cpu_i9", label: "Intel Core i9", icon: "fa-microchip", match: p => /i9\b/i.test(p["Full Name"]) },
                { key: "laptop_cpu_ultra", label: "Core Ultra 5/7/9", icon: "fa-microchip", match: p => /core\s*ultra/i.test(p["Full Name"]) },
                { key: "laptop_cpu_r5", label: "Ryzen 5",       icon: "fa-microchip", match: p => /ryzen\s*5/i.test(p["Full Name"]) },
                { key: "laptop_cpu_r7", label: "Ryzen 7",       icon: "fa-microchip", match: p => /ryzen\s*7/i.test(p["Full Name"]) },
                { key: "laptop_cpu_r9", label: "Ryzen 9",       icon: "fa-microchip", match: p => /ryzen\s*9/i.test(p["Full Name"]) },
                { key: "laptop_cpu_apple", label: "Apple Silicon M1-M4", icon: "fa-apple", match: p => /\b(?:m1|m2|m3|m4)\b/i.test(p["Full Name"]) },
            ]},
            { group: "Graphics (GPU)", filters: [
                { key: "laptop_gpu_rtx50", label: "NVIDIA RTX 50-Series", icon: "fa-server", match: p => /rtx\s*50\d\d|rtx\s*50-series/i.test(p["Full Name"]) },
                { key: "laptop_gpu_rtx4050", label: "RTX 4050", icon: "fa-server", match: p => /4050/i.test(p["Full Name"]) },
                { key: "laptop_gpu_rtx4060", label: "RTX 4060", icon: "fa-server", match: p => /4060/i.test(p["Full Name"]) },
                { key: "laptop_gpu_rtx4070", label: "RTX 4070", icon: "fa-server", match: p => /4070/i.test(p["Full Name"]) },
                { key: "laptop_gpu_rtx4080_90", label: "RTX 4080/4090", icon: "fa-server", match: p => /4080|4090/i.test(p["Full Name"]) },
                { key: "laptop_gpu_rtx30", label: "NVIDIA RTX 30-Series", icon: "fa-server", match: p => /rtx\s*30\d\d/i.test(p["Full Name"]) },
                { key: "laptop_gpu_gtx", label: "NVIDIA GTX Series", icon: "fa-server", match: p => /gtx/i.test(p["Full Name"]) },
                { key: "laptop_gpu_integrated", label: "Integrated / Radeon / Iris Xe", icon: "fa-server", match: p => /radeon|iris|uhd|integrated/i.test(p["Full Name"]) || !/rtx|gtx|geforce|quadro/i.test(p["Full Name"]) },
            ]},
            { group: "Memory (RAM)", filters: [
                { key: "laptop_ram_8",  label: "8GB",   icon: "fa-memory", match: p => /\b8\s*gb\b/i.test(p["Full Name"]) && !/rtx|graphics/i.test(p["Full Name"]) },
                { key: "laptop_ram_16", label: "16GB",  icon: "fa-memory", match: p => /\b16\s*gb\b/i.test(p["Full Name"]) && !/rtx|graphics/i.test(p["Full Name"]) },
                { key: "laptop_ram_32", label: "32GB+", icon: "fa-memory", match: p => /\b(32|64)\s*gb\b/i.test(p["Full Name"]) && !/rtx|graphics/i.test(p["Full Name"]) },
            ]},
        ],
        "Prebuilt PC": [
            { group: "Processor", filters: [
                { key: "pc_cpu_i3_r3", label: "Core i3 / Ryzen 3", icon: "fa-microchip", match: p => /i3\b|ryzen\s*3/i.test(p["Full Name"]) },
                { key: "pc_cpu_i5_r5", label: "Core i5 / Ryzen 5", icon: "fa-microchip", match: p => /i5\b|ryzen\s*5/i.test(p["Full Name"]) },
                { key: "pc_cpu_i7_r7", label: "Core i7 / Ryzen 7", icon: "fa-microchip", match: p => /i7\b|ryzen\s*7/i.test(p["Full Name"]) },
                { key: "pc_cpu_i9_r9", label: "Core i9 / Ryzen 9", icon: "fa-microchip", match: p => /i9\b|ryzen\s*9/i.test(p["Full Name"]) },
            ]},
            { group: "Graphics Card", filters: [
                { key: "pc_gpu_rtx50", label: "RTX 50-Series", icon: "fa-server", match: p => /rtx\s*50\d\d/i.test(p["Full Name"]) },
                { key: "pc_gpu_rtx4060", label: "RTX 4060 / Ti", icon: "fa-server", match: p => /4060/i.test(p["Full Name"]) },
                { key: "pc_gpu_rtx4070", label: "RTX 4070 / Ti", icon: "fa-server", match: p => /4070/i.test(p["Full Name"]) },
                { key: "pc_gpu_rtx4080_90", label: "RTX 4080 / 4090", icon: "fa-server", match: p => /4080|4090/i.test(p["Full Name"]) },
                { key: "pc_gpu_rtx30", label: "RTX 30-Series", icon: "fa-server", match: p => /rtx\s*30\d\d/i.test(p["Full Name"]) },
                { key: "pc_gpu_gtx", label: "GTX Series", icon: "fa-server", match: p => /gtx/i.test(p["Full Name"]) },
                { key: "pc_gpu_integrated", label: "Integrated Graphics", icon: "fa-server", match: p => /integrated|uhd|radeon|graphics/i.test(p["Full Name"]) && !/rtx|gtx|geforce/i.test(p["Full Name"]) },
            ]},
        ],
        "Motherboard": [
            { group: "Socket & Chipset", filters: [
                { key: "mb_am5",     label: "AMD AM5",      icon: "fa-chess-board", match: p => /\bam5\b|b650|x670|a620/i.test(p["Full Name"]) },
                { key: "mb_am4",     label: "AMD AM4",      icon: "fa-chess-board", match: p => /\bam4\b|b550|x570|b450|a520/i.test(p["Full Name"]) },
                { key: "mb_lga1700", label: "Intel LGA1700", icon: "fa-chess-board", match: p => /lga1700|lga\s*1700|z790|b760|h610|z690|b660/i.test(p["Full Name"]) },
                { key: "mb_lga1200", label: "Intel LGA1200", icon: "fa-chess-board", match: p => /lga1200|lga\s*1200|h510|b560|z590/i.test(p["Full Name"]) },
            ]},
            { group: "Memory Support", filters: [
                { key: "mb_ddr5", label: "DDR5", icon: "fa-memory", match: p => /ddr5/i.test(p["Full Name"]) },
                { key: "mb_ddr4", label: "DDR4", icon: "fa-memory", match: p => /ddr4/i.test(p["Full Name"]) },
            ]},
            { group: "Form Factor", filters: [
                { key: "mb_atx",  label: "ATX",       icon: "fa-chess-board", match: p => /\batx\b/i.test(p["Full Name"]) && !/micro|m-atx|mini|itx/i.test(p["Full Name"]) },
                { key: "mb_matx", label: "Micro-ATX", icon: "fa-chess-board", match: p => /micro.?atx|m.?atx/i.test(p["Full Name"]) },
                { key: "mb_itx",  label: "Mini-ITX",  icon: "fa-chess-board", match: p => /mini.?itx|itx/i.test(p["Full Name"]) },
            ]}
        ],
        "RAM": [
            { group: "DDR Generation", filters: [
                { key: "ram_ddr5", label: "DDR5", icon: "fa-memory", match: p => /ddr5/i.test(p["Full Name"]) },
                { key: "ram_ddr4", label: "DDR4", icon: "fa-memory", match: p => /ddr4/i.test(p["Full Name"]) },
            ]},
            { group: "Capacity", filters: [
                { key: "ram_8gb",  label: "8GB",   icon: "fa-memory", match: p => /\b8\s*gb\b/i.test(p["Full Name"]) && !/x\s*2|2\s*x/i.test(p["Full Name"]) },
                { key: "ram_16gb", label: "16GB",  icon: "fa-memory", match: p => /\b16\s*gb\b/i.test(p["Full Name"]) || /8gb\s*x\s*2|2\s*x\s*8gb/i.test(p["Full Name"]) },
                { key: "ram_32gb", label: "32GB",  icon: "fa-memory", match: p => /\b32\s*gb\b/i.test(p["Full Name"]) || /16gb\s*x\s*2|2\s*x\s*16gb/i.test(p["Full Name"]) },
                { key: "ram_64gb", label: "64GB+", icon: "fa-memory", match: p => /\b(64|128)\s*gb\b/i.test(p["Full Name"]) || /32gb\s*x\s*2|2\s*x\s*32gb/i.test(p["Full Name"]) },
            ]},
            { group: "Form Factor", filters: [
                { key: "ram_sodimm",  label: "Laptop (SO-DIMM)", icon: "fa-laptop", match: p => /sodimm|so-dimm|laptop/i.test(p["Full Name"]) },
                { key: "ram_desktop", label: "Desktop (UDIMM)",  icon: "fa-desktop", match: p => !/sodimm|so-dimm|laptop/i.test(p["Full Name"]) },
            ]}
        ],
        "Case": [
            { group: "Color", filters: [
                { key: "case_white", label: "White", icon: "fa-palette", match: p => /\bwhite\b/i.test(p["Full Name"]) },
                { key: "case_black", label: "Black", icon: "fa-palette", match: p => /\bblack\b/i.test(p["Full Name"]) },
            ]},
            { group: "Form Factor", filters: [
                { key: "case_itx",   label: "Mini-ITX / SFF", icon: "fa-box", match: p => /itx|mini-itx|sff/i.test(p["Full Name"]) },
                { key: "case_mid",   label: "Mid Tower",      icon: "fa-box", match: p => /mid.?tower|h5 flow|h7 flow|o11/i.test(p["Full Name"]) },
                { key: "case_full",  label: "Full Tower",     icon: "fa-box", match: p => /full.?tower|h9 flow/i.test(p["Full Name"]) },
            ]},
            { group: "Features", filters: [
                { key: "case_rgb",   label: "RGB / ARGB", icon: "fa-lightbulb", match: p => /rgb|argb/i.test(p["Full Name"]) },
                { key: "case_glass", label: "Glass Panel",icon: "fa-window-maximize", match: p => /glass|panoramic/i.test(p["Full Name"]) },
            ]}
        ],
        "Fan": [
            { group: "Cooler Type", filters: [
                { key: "cooling_air",    label: "Air Cooler",    icon: "fa-wind", match: p => /air|tower cooler/i.test(p["Full Name"]) || !/aio|liquid|water/i.test(p["Full Name"]) },
                { key: "cooling_liquid", label: "Liquid (AIO)", icon: "fa-droplet", match: p => /aio|liquid|water/i.test(p["Full Name"]) },
            ]},
            { group: "Radiator Size", filters: [
                { key: "rad_120_140", label: "120mm / 140mm", icon: "fa-fan", match: p => /120|140/i.test(p["Full Name"]) && /aio|liquid|water/i.test(p["Full Name"]) },
                { key: "rad_240_280", label: "240mm / 280mm", icon: "fa-fan", match: p => /240|280/i.test(p["Full Name"]) },
                { key: "rad_360_420", label: "360mm / 420mm", icon: "fa-fan", match: p => /360|420/i.test(p["Full Name"]) },
            ]},
            { group: "Pack Quantity", filters: [
                { key: "fan_single", label: "Single Fan", icon: "fa-fan", match: p => !/pack|kit|x2|x3/i.test(p["Full Name"]) },
                { key: "fan_multi",  label: "Multi Pack", icon: "fa-cubes", match: p => /pack|kit|x2|x3/i.test(p["Full Name"]) },
            ]}
        ],
        "Desks & Chairs": [
            { group: "Type", filters: [
                { key: "furniture_chair", label: "Gaming Chair", icon: "fa-chair",  match: p => /chair|throne/i.test(p["Full Name"]) },
                { key: "furniture_desk",  label: "Desk / Table",  icon: "fa-table",  match: p => /desk|table/i.test(p["Full Name"]) },
                { key: "furniture_mat",   label: "Desk Mat",      icon: "fa-square", match: p => /mat|pad/i.test(p["Full Name"]) },
            ]}
        ],
        "Lighting & RGB": [
            { group: "Type", filters: [
                { key: "light_strip",      label: "LED Strip",   icon: "fa-grip-lines", match: p => /strip/i.test(p["Full Name"]) },
                { key: "light_lamp",       label: "Lamp / Light",icon: "fa-lightbulb",  match: p => /lamp|light|screenbar/i.test(p["Full Name"]) },
                { key: "light_hub",        label: "RGB Hub / Controller", icon: "fa-network-wired", match: p => /hub|controller/i.test(p["Full Name"]) },
            ]}
        ],
    };

    // Category details with specific icons mapping
    const CATEGORY_MAP = {
        "Monitor": { label: "Monitors", icon: "fa-desktop", emoji: "🖥️", color: "#00b4d8", desc: "Full HD, QHD & 4K displays", tags: ["Full HD", "QHD", "4K", "Curved", "IPS", "VA", "144Hz", "240Hz"] },
        "Monitor Arm": { label: "Monitor Arms", icon: "fa-dolly", emoji: "🦾", color: "#a78bfa", desc: "Single, dual & triple mounts", tags: ["Single Arm", "Dual Arm", "Triple Arm", "Gas Spring", "VESA 75/100"] },
        "GPU": { label: "Graphics Cards", icon: "fa-server", emoji: "🎮", color: "#f97316", desc: "NVIDIA & AMD gaming GPUs", tags: ["NVIDIA RTX", "AMD RX", "4GB VRAM", "8GB VRAM", "16GB VRAM", "DLSS"] },
        "Processor": { label: "Processors (CPU)", icon: "fa-microchip", emoji: "🔲", color: "#3b82f6", desc: "Intel Core & AMD Ryzen", tags: ["Intel Core i5", "Intel Core i7", "Intel Core i9", "AMD Ryzen 5", "AMD Ryzen 7"] },
        "Motherboard": { label: "Motherboards", icon: "fa-chess-board", emoji: "🗜️", color: "#34d399", desc: "ATX, mATX & ITX boards", tags: ["ATX", "mATX", "Mini-ITX", "LGA1700", "AM5", "DDR4", "DDR5"] },
        "RAM": { label: "Memory (RAM)", icon: "fa-memory", emoji: "🧩", color: "#ec4899", desc: "DDR4 & DDR5 memory kits", tags: ["DDR4", "DDR5", "8GB", "16GB", "32GB", "64GB", "RGB", "3200MHz", "6000MHz"] },
        "SSD": { label: "SSDs (M.2/SATA)", icon: "fa-database", emoji: "💾", color: "#f59e0b", desc: "NVMe M.2 & SATA drives", tags: ["NVMe M.2", "SATA SSD", "250GB", "500GB", "1TB", "2TB", "PCIe Gen 4"] },
        "Hard Disk": { label: "Hard Disks (HDD)", icon: "fa-hdd", emoji: "💿", color: "#94a3b8", desc: "High-capacity storage drives", tags: ["1TB", "2TB", "4TB", "6TB", "8TB", "7200 RPM", "NAS Grade"] },
        "Case": { label: "PC Cases", icon: "fa-box", emoji: "🖥", color: "#d946ef", desc: "ATX towers & compact cases", tags: ["Full Tower", "Mid Tower", "Mini-ITX", "RGB", "Tempered Glass", "White"] },
        "PSU": { label: "Power Supplies", icon: "fa-plug", emoji: "⚡", color: "#eab308", desc: "Modular & semi-modular PSUs", tags: ["550W", "650W", "750W", "850W", "1000W", "80+ Gold", "80+ Platinum", "Fully Modular"] },
        "Fan": { label: "Fans & Coolers", icon: "fa-fan", emoji: "🌀", color: "#38bdf8", desc: "Air coolers & AIO liquid cooling", tags: ["Air Cooler", "120mm AIO", "240mm AIO", "360mm AIO", "ARGB", "Low Profile"] },
        "Thermal Paste": { label: "Thermal Paste", icon: "fa-temperature-half", emoji: "🧪", color: "#f43f5e", desc: "Thermal paste, liquid metal & pads", tags: ["Thermal Paste", "Liquid Metal", "Thermal Pads", "Kryonaut", "MX-6", "Conductonaut"] },
        "Laptop": { label: "Laptops", icon: "fa-laptop", emoji: "💻", color: "#6366f1", desc: "Gaming, business & student laptops", tags: ["Gaming Laptop", "Ultrabook", "MacBook", "Intel Core", "Ryzen", "RTX Laptops"] },
        "Prebuilt PC": { label: "Prebuilt PCs", icon: "fa-desktop-retro", emoji: "🖥️", color: "#10b981", desc: "Pre-assembled gaming & office desktops", tags: ["Gaming PC", "Office PC", "Branded PC", "Custom PC", "Workstation"] },
        "Peripherals": { label: "Peripherals", icon: "fa-keyboard", emoji: "⌨️", color: "#06b6d4", desc: "Mice, keyboards & mouse pads", tags: ["Gaming Mouse", "Mechanical KB", "Mouse Pad", "Wireless", "Wired", "TKL", "60%"] },
        "Controllers": { label: "Controllers", icon: "fa-gamepad", emoji: "🎮", color: "#f43f5e", desc: "Console & PC game controllers", tags: ["Xbox", "PlayStation", "PC USB", "Wireless", "Wired", "Fight Stick"] },
        "Audio Gear": { label: "Audio Gear", icon: "fa-headphones", emoji: "🎧", color: "#8b5cf6", desc: "Headsets, microphones & speakers", tags: ["Gaming Headset", "Studio Mic", "USB Mic", "XLR", "7.1 Surround", "Active Noise Cancel"] },
        "Stream Gear": { label: "Stream Gear", icon: "fa-sliders", emoji: "🎙️", color: "#f97316", desc: "Stream decks, mixers & mic stands", tags: ["Stream Deck", "Audio Mixer", "Mic Arm", "Shock Mount", "Elgato", "Rode"] },
        "Lighting & RGB": { label: "Lighting & RGB", icon: "fa-lightbulb", emoji: "💡", color: "#ec4899", desc: "RGB lights & LED strip lights", tags: ["LED Strip", "RGB Hub", "Ambient Light", "Corner Lamp", "Smart LED", "Govee"] },
        "Desks & Chairs": { label: "Desks & Chairs", icon: "fa-chair", emoji: "💺", color: "#10b981", desc: "Gaming chairs & gaming tables", tags: ["Gaming Chair", "Ergonomic Chair", "Standing Desk", "L-Shape Desk", "Desk Mat"] },
        "Webcams": { label: "Webcams", icon: "fa-video", emoji: "📷", color: "#0ea5e9", desc: "High-resolution webcams", tags: ["1080p", "4K", "60fps", "Auto Focus", "Privacy Cover", "Ring Light", "Streaming"] }
    };

    // DOM ELEMENTS
    const catHomepage = document.getElementById("category-homepage");
    const catHomeGrid = document.getElementById("cat-home-grid");
    const mainLayout = document.getElementById("main-layout");
    const btnBackCategories = document.getElementById("btn-back-categories");
    const browsingLabel = document.getElementById("browsing-label");

    const gridContainer = document.getElementById("products-catalog-grid");
    const paginationPanel = document.getElementById("pagination-panel");
    const searchInput = document.getElementById("search-input");
    const btnClearSearch = document.getElementById("btn-clear-search");
    const storeFilters = document.querySelectorAll(".store-filter");
    const categoryFilterList = document.getElementById("category-filter-list");
    const priceMinInput = document.getElementById("price-min");
    const priceMaxInput = document.getElementById("price-max");
    const sliderMin = document.getElementById("slider-min");
    const sliderMax = document.getElementById("slider-max");
    const sliderTrack = document.getElementById("slider-track");
    const stockToggle = document.getElementById("stock-only-toggle");
    const sortSelect = document.getElementById("sort-select");
    const btnResetFilters = document.getElementById("btn-reset-filters");

    // Stats elements
    const statTotal = document.getElementById("stat-total-products");
    const statIgeek = document.getElementById("stat-igeek-count");
    const statCity = document.getElementById("stat-city-count");
    const statOsjo = document.getElementById("stat-osjo-count");
    const resultsCountText = document.getElementById("results-count-text");
    const activeChipsContainer = document.getElementById("active-chips-container");

    // Compare UI elements
    const compareTray = document.getElementById("compare-tray");
    const compareTrayToggle = document.getElementById("compare-tray-toggle");
    const trayChevron = document.getElementById("tray-chevron");
    const compareSlots = document.getElementById("compare-slots");
    const btnTriggerCompare = document.getElementById("btn-trigger-compare");
    const btnClearCompareAll = document.getElementById("btn-clear-compare-all");
    const compareCountBadge = document.getElementById("compare-count");

    // Compare Modal elements
    const compareModal = document.getElementById("compare-modal");
    const btnCloseCompareModal = document.getElementById("btn-close-compare-modal");

    // Theme Switcher elements
    const btnThemeToggle = document.getElementById("theme-toggle-btn");
    const themeIcon = document.getElementById("theme-icon");

    // Initialize Theme state (Default: Dark Mode)
    const storedTheme = localStorage.getItem("theme") || "dark";
    if (storedTheme === "dark") {
        document.body.classList.add("dark-theme");
        if (themeIcon) themeIcon.className = "fa-solid fa-sun";
    } else {
        document.body.classList.remove("dark-theme");
        if (themeIcon) themeIcon.className = "fa-solid fa-moon";
    }

    if (btnThemeToggle) {
        btnThemeToggle.addEventListener("click", () => {
            const isDark = document.body.classList.toggle("dark-theme");
            localStorage.setItem("theme", isDark ? "dark" : "light");

            if (themeIcon) {
                themeIcon.style.transition = "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease";
                themeIcon.style.transform = "scale(0) rotate(-90deg)";
                themeIcon.style.opacity = "0";
                setTimeout(() => {
                    themeIcon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
                    themeIcon.style.transform = "scale(1) rotate(0deg)";
                    themeIcon.style.opacity = "1";
                }, 200);
            }
        });
    }

    // ---- Header search bar drives the search query ----
    const headerSearchBar = document.getElementById("header-search-bar");
    if (headerSearchBar) {
        let headerTypingTimer;
        headerSearchBar.addEventListener("input", () => {
            clearTimeout(headerTypingTimer);
            searchQuery = headerSearchBar.value.trim();
            // If we are on the homepage and user types, jump to All category
            if (searchQuery.length > 0 && catHomepage.style.display !== "none") {
                goToCategory("all");
            }
            headerTypingTimer = setTimeout(() => {
                currentPage = 1;
                applyFiltersAndSorting();
            }, 300);
        });
    }

    // ================= 1. INITIAL LOADING & METADATA COMPILATION =================
    async function loadProductCatalog() {
        try {
            let response;
            try {
                // Try current directory first (JSON database)
                response = await fetch("products.json");
                if (!response.ok) throw new Error("Not found in current folder");
            } catch (e) {
                // Fall back to parent directory (JSON database)
                response = await fetch("../web/products.json");
                if (!response.ok) {
                    response = await fetch("web/products.json");
                    if (!response.ok) {
                        throw new Error("Could not find 'products.json' in current or fallback folders.");
                    }
                }
            }

            const sheetData = await response.json();

            // Clean up fields and parse prices
            allProducts = sheetData.map(p => {
                // Default missing structural fields
                if (!p["Component Type"]) p["Component Type"] = "Unknown";
                if (!p["Status"]) p["Status"] = "In Stock";
                if (!p["Image URL"]) p["Image URL"] = "";

                // Map attributes dynamically
                p.price_val = p.price_val || 0.0;
                p.screen_size = p.screen_size || null;
                p.refresh_rate = p.refresh_rate || null;
                p.response_time = p.response_time || null;
                p.arms_supported = p.arms_supported || null;
                p.weight_support = p.weight_support || null;

                if (CATEGORY_MAP[p["Component Type"]]) {
                    p.category_key = p["Component Type"];
                } else {
                    p.category_key = "Unknown";
                }
                return p;
            });

            console.log(`Loaded ${allProducts.length} items successfully from JSON.`);

            compileMetadata();
            initializeFilterUI();
            renderCategoryHomepage();
            // Don't call applyFiltersAndSorting here — homepage is shown first


        } catch (error) {
            console.error("Initialization Error: ", error);
            gridContainer.innerHTML = `
                <div class="catalog-empty-state">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <h3>Data Sync Error</h3>
                    <p>${error.message}</p>
                    <p style="font-size:0.85rem;color:var(--text-muted);">Please make sure you have placed and exported 'products.json' in your web directory.</p>
                </div>
            `;
        }
    }

    function compileMetadata() {
        // Compile counts
        let countIgeek = 0;
        let countCity = 0;
        let countOsjo = 0;
        let countPcCircle = 0;
        let countTaipei = 0;
        let countMcc = 0;
        let countGameon = 0;

        let minPrice = Infinity;
        let maxPrice = -Infinity;

        allProducts.forEach(p => {
            // Count per store
            const store = p["Website Name"];
            if (store === "iGeek.jo") countIgeek++;
            else if (store === "City Center") countCity++;
            else if (store === "Oriental Store") countOsjo++;
            else if (store === "PC Circle") countPcCircle++;
            else if (store === "Taipei Computer") countTaipei++;
            else if (store === "MCC Jordan") countMcc++;
            else if (store === "Game On Jordan") countGameon++;

            // Min/max prices
            if (p.price_val > 0) {
                if (p.price_val < minPrice) minPrice = p.price_val;
                if (p.price_val > maxPrice) maxPrice = p.price_val;
            }
        });

        dataPriceMin = Math.floor(minPrice === Infinity ? 0 : minPrice);
        dataPriceMax = Math.ceil(maxPrice === -Infinity ? 1000 : maxPrice);
        currentFilterMin = dataPriceMin;
        currentFilterMax = dataPriceMax;

        // Update stats widgets
        statTotal.textContent = allProducts.length.toLocaleString();
        statIgeek.textContent = countIgeek.toLocaleString();
        statCity.textContent = countCity.toLocaleString();
        statOsjo.textContent = countOsjo.toLocaleString();

        const badgePcCircle = document.getElementById("stat-pccircle-count");
        const badgeTaipei = document.getElementById("stat-taipei-count");
        const badgeMcc = document.getElementById("stat-mcc-count");
        const badgeGameon = document.getElementById("stat-gameon-count");
        if (badgePcCircle) badgePcCircle.textContent = countPcCircle.toLocaleString();
        if (badgeTaipei) badgeTaipei.textContent = countTaipei.toLocaleString();
        if (badgeMcc) badgeMcc.textContent = countMcc.toLocaleString();
        if (badgeGameon) badgeGameon.textContent = countGameon.toLocaleString();
    }

    function initializeFilterUI() {
        // 1. Dynamic category grid injection
        let categoryGridHTML = `
            <button class="btn-category active" data-category="all">
                <i class="fa-solid fa-border-all"></i> All Parts
            </button>
        `;

        Object.keys(CATEGORY_MAP).forEach(key => {
            const cat = CATEGORY_MAP[key];
            categoryGridHTML += `
                <button class="btn-category" data-category="${key}">
                    <i class="fa-solid ${cat.icon}"></i> ${cat.label}
                </button>
            `;
        });

        categoryFilterList.innerHTML = categoryGridHTML;

        // Add Category Click Event Listeners
        const categoryButtons = document.querySelectorAll(".btn-category");
        categoryButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                categoryButtons.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                selectedCategory = btn.getAttribute("data-category");
                activeSpecFilters.clear();
                renderSpecFilterUI(selectedCategory);
                currentPage = 1;
                applyFiltersAndSorting();
            });
        });

        // 2. Set up Double Price Slider inputs
        priceMinInput.value = dataPriceMin;
        priceMaxInput.value = dataPriceMax;

        sliderMin.min = dataPriceMin;
        sliderMin.max = dataPriceMax;
        sliderMin.value = dataPriceMin;

        sliderMax.min = dataPriceMin;
        sliderMax.max = dataPriceMax;
        sliderMax.value = dataPriceMax;

        updateSliderTrack();

        // 3. Set up Spec Filter clear button
        const btnClearSpecFilters = document.getElementById("btn-clear-spec-filters");
        if (btnClearSpecFilters) {
            btnClearSpecFilters.addEventListener("click", () => {
                activeSpecFilters.clear();
                renderSpecFilterUI(selectedCategory);
                currentPage = 1;
                applyFiltersAndSorting();
            });
        }
    }

    // Helper to count matching products for a simulated spec filter option
    // based on all OTHER current active filters (store, category, price, search, stock, and other spec filters).
    function getFilterMatchCount(specKey, categoryKey) {
        const specs = SPEC_FILTERS[categoryKey] || [];
        let targetFilter = null;
        for (const group of specs) {
            for (const f of group.filters) {
                if (f.key === specKey) {
                    targetFilter = f;
                    break;
                }
            }
            if (targetFilter) break;
        }
        if (!targetFilter) return 0;

        const simulatedSpecs = new Set(activeSpecFilters);
        simulatedSpecs.add(specKey);

        let count = 0;
        allProducts.forEach(p => {
            // Check Store origin
            if (!selectedStores.includes(p["Website Name"])) return;

            // Check Component Category
            if (selectedCategory !== "all" && p.category_key !== selectedCategory) return;

            // Check Stock status
            if (stockOnly && p.Status !== "In Stock") return;

            // Check Price boundaries
            if (p.price_val < currentFilterMin || p.price_val > currentFilterMax) return;

            // Check simulated spec filters (OR within group, AND across groups)
            for (const group of specs) {
                const activeGroupFilters = group.filters.filter(f => simulatedSpecs.has(f.key));
                if (activeGroupFilters.length > 0) {
                    if (!activeGroupFilters.some(f => f.match(p))) return;
                }
            }

            // Check Search query
            if (searchQuery) {
                const titleLower = p["Full Name"].toLowerCase();
                const catLower = p["Component Type"].toLowerCase();
                const storeLower = p["Website Name"].toLowerCase();
                const terms = searchQuery.toLowerCase().split(/\s+/);
                const matchesSearch = terms.every(term =>
                    titleLower.includes(term) ||
                    catLower.includes(term) ||
                    storeLower.includes(term)
                );
                if (!matchesSearch) return;
            }

            count++;
        });

        return count;
    }

    // Helper to check if a specific spec filter option has any matching products
    // based on all OTHER current active filters.
    function wouldFilterHaveResults(specKey, categoryKey) {
        if (activeSpecFilters.has(specKey)) {
            return true;
        }
        return getFilterMatchCount(specKey, categoryKey) > 0;
    }

    // ---- Render spec filter pills for current category (collapsible accordion) ----
    function renderSpecFilterUI(categoryKey) {
        const specGroup = document.getElementById("spec-filter-group");
        const specContainer = document.getElementById("spec-filters-container");
        if (!specGroup || !specContainer) return;

        const specs = SPEC_FILTERS[categoryKey];
        if (!specs || specs.length === 0) {
            specGroup.style.display = "none";
            specContainer.innerHTML = "";
            return;
        }

        // Remember which accordions were manually open before rewriting the HTML
        const openGroups = new Set();
        specContainer.querySelectorAll(".spec-accordion-body.open").forEach(body => {
            openGroups.add(body.id);
        });

        specGroup.style.display = "flex";
        let html = "";
        let visibleGroupsCount = 0;

        specs.forEach((group, idx) => {
            // Filter pills to only show those that are active OR would yield results if clicked
            const visibleFilters = group.filters.filter(f => {
                const isActive = activeSpecFilters.has(f.key);
                const hasResults = wouldFilterHaveResults(f.key, categoryKey);
                return isActive || hasResults;
            });

            // If no filters are visible in this group, do not render the group at all
            if (visibleFilters.length === 0) return;
            visibleGroupsCount++;

            // Check if any filter in this group is active
            const hasActive = visibleFilters.some(f => activeSpecFilters.has(f.key));
            const groupId = `spec-grp-${idx}`;
            
            // Start open if: manually open previously OR has active filters inside
            const isOpen = openGroups.has(groupId) || hasActive;

            html += `<div class="spec-accordion" data-group-idx="${idx}">`;
            // Toggle button header
            html += `<button class="spec-accordion-toggle ${hasActive ? 'has-active' : ''} ${isOpen ? 'open' : ''}" data-target="${groupId}">
                <span class="spec-accordion-label">${group.group}</span>
                ${hasActive ? `<span class="spec-active-badge">${visibleFilters.filter(f => activeSpecFilters.has(f.key)).length}</span>` : ''}
                <i class="fa-solid fa-chevron-down spec-accordion-chevron"></i>
            </button>`;
            // Collapsible body
            html += `<div class="spec-accordion-body ${isOpen ? 'open' : ''}" id="${groupId}">`;
            html += `<div class="spec-filter-pills">`;
            visibleFilters.forEach(f => {
                const isActive = activeSpecFilters.has(f.key);
                const count = getFilterMatchCount(f.key, categoryKey);
                html += `<button class="spec-filter-pill ${isActive ? 'active' : ''}" data-spec-key="${f.key}">
                        <i class="fa-solid ${f.icon}"></i>${f.label} <span class="spec-pill-count">${count}</span>
                    </button>`;
            });
            html += `</div></div></div>`;
        });

        specContainer.innerHTML = html;

        // If all accordion groups are hidden, hide the container group
        if (visibleGroupsCount === 0) {
            specGroup.style.display = "none";
        }

        // Bind accordion toggles
        specContainer.querySelectorAll(".spec-accordion-toggle").forEach(toggle => {
            toggle.addEventListener("click", () => {
                const targetId = toggle.getAttribute("data-target");
                const body = document.getElementById(targetId);
                const isOpen = body.classList.contains("open");
                body.classList.toggle("open", !isOpen);
                toggle.classList.toggle("open", !isOpen);
            });
        });

        // Bind click events to spec pills
        specContainer.querySelectorAll(".spec-filter-pill").forEach(pill => {
            pill.addEventListener("click", () => {
                const key = pill.getAttribute("data-spec-key");
                if (activeSpecFilters.has(key)) {
                    activeSpecFilters.delete(key);
                } else {
                    activeSpecFilters.add(key);
                }
                currentPage = 1;
                applyFiltersAndSorting();
            });
        });
    }

    // ---- Return the flat list of filter definitions for current active spec filters ----
    function getActiveSpecFilterMatchers() {
        const specs = SPEC_FILTERS[selectedCategory];
        if (!specs || activeSpecFilters.size === 0) return [];
        const matchers = [];
        specs.forEach(group => {
            group.filters.forEach(f => {
                if (activeSpecFilters.has(f.key)) matchers.push(f);
            });
        });
        return matchers;
    }

    // ================= CATEGORY HOMEPAGE =================
    function renderCategoryHomepage() {
        catHomeGrid.innerHTML = "";
        Object.keys(CATEGORY_MAP).forEach(key => {
            const cat = CATEGORY_MAP[key];
            const count = allProducts.filter(p => p.category_key === key).length;
            if (count === 0) return; // hide empty categories

            // Build tag pills HTML
            const tagsHTML = (cat.tags || []).map(t =>
                `<span class="cat-home-tag-pill">${t}</span>`
            ).join("");

            const card = document.createElement("div");
            card.className = "cat-home-card";
            card.setAttribute("data-category", key);
            card.style.setProperty("--cat-color", cat.color);

            card.innerHTML = `
                <i class="fa-solid ${cat.icon} cat-home-icon-glyph"></i>
                <h3>${cat.label}</h3>
                <div class="cat-home-tags-reveal">
                    ${tagsHTML}
                </div>
                <div class="cat-home-footer">
                    <span class="cat-home-card-count-badge">
                        <i class="fa-solid fa-tag"></i> ${count.toLocaleString()} items
                    </span>
                </div>
            `;

            card.addEventListener("click", () => {
                goToCategory(key);
            });
            catHomeGrid.appendChild(card);
        });
    }

    function goToCategory(categoryKey) {
        selectedCategory = categoryKey;
        currentPage = 1;
        activeSpecFilters.clear();

        // Update sidebar category buttons
        const categoryButtons = document.querySelectorAll(".btn-category");
        categoryButtons.forEach(b => {
            b.classList.toggle("active", b.getAttribute("data-category") === categoryKey);
        });

        const cat = CATEGORY_MAP[categoryKey];
        if (browsingLabel) {
            if (cat) {
                browsingLabel.innerHTML = `<i class="fa-solid ${cat.icon}" style="color:${cat.color}"></i> Browsing: <strong style="color:${cat.color}">${cat.label}</strong>`;
            } else {
                browsingLabel.innerHTML = `<i class="fa-solid fa-border-all" style="color:var(--orange)"></i> Browsing: <strong style="color:var(--orange)">All Categories</strong>`;
            }
        }

        // Show catalog, hide homepage
        catHomepage.style.display = "none";
        mainLayout.style.display = "";

        // Render category-specific spec filter pills
        renderSpecFilterUI(categoryKey);

        applyFiltersAndSorting();
    }

    function goBackToHomepage() {
        catHomepage.style.display = "";
        mainLayout.style.display = "none";
        selectedCategory = "all";
        activeSpecFilters.clear();

        // Reset sidebar category
        const categoryButtons = document.querySelectorAll(".btn-category");
        categoryButtons.forEach(b => {
            b.classList.toggle("active", b.getAttribute("data-category") === "all");
        });

        // Hide spec filters
        const specGroup = document.getElementById("spec-filter-group");
        if (specGroup) specGroup.style.display = "none";
    }

    // ================= 2. FILTERING AND SORTING ACTIONS =================
    function applyFiltersAndSorting() {
        // 1. Apply active filter rules
        filteredProducts = allProducts.filter(p => {
            // Check Store origin
            if (!selectedStores.includes(p["Website Name"])) return false;

            // Check Component Category
            if (selectedCategory !== "all" && p.category_key !== selectedCategory) return false;

            // Check Stock status
            if (stockOnly && p.Status !== "In Stock") return false;

            // Check Price boundaries
            if (p.price_val < currentFilterMin || p.price_val > currentFilterMax) return false;

            // Check Spec Filters — OR within groups, AND across groups
            if (activeSpecFilters.size > 0) {
                const specs = SPEC_FILTERS[selectedCategory] || [];
                for (const group of specs) {
                    const activeGroupFilters = group.filters.filter(f => activeSpecFilters.has(f.key));
                    if (activeGroupFilters.length > 0) {
                        if (!activeGroupFilters.some(f => f.match(p))) return false;
                    }
                }
            }

            // Check Search query
            if (searchQuery) {
                const titleLower = p["Full Name"].toLowerCase();
                const catLower = p["Component Type"].toLowerCase();
                const storeLower = p["Website Name"].toLowerCase();
                const terms = searchQuery.toLowerCase().split(/\s+/);

                // All typed terms must match either name, category, or store
                return terms.every(term =>
                    titleLower.includes(term) ||
                    catLower.includes(term) ||
                    storeLower.includes(term)
                );
            }

            return true;
        });

        // 2. Apply active sorting choice
        if (sortBy === "price-asc") {
            filteredProducts.sort((a, b) => a.price_val - b.price_val);
        } else if (sortBy === "price-desc") {
            filteredProducts.sort((a, b) => b.price_val - a.price_val);
        } else if (sortBy === "name-asc") {
            filteredProducts.sort((a, b) => a["Full Name"].localeCompare(b["Full Name"]));
        } else if (sortBy === "category") {
            filteredProducts.sort((a, b) => a.category_key.localeCompare(b.category_key));
        }

        // 3. Update Result widgets
        resultsCountText.innerHTML = `Found <span style="color:var(--neon-cyan);">${filteredProducts.length}</span> components matching filters`;
        renderChips();
        renderProductsCatalog();
        
        // Dynamically re-render spec filters so incompatible options auto-hide in real-time
        renderSpecFilterUI(selectedCategory);
    }

    // Renders tags at the top showing current active filtering choices
    function renderChips() {
        let chipsHTML = "";

        if (selectedCategory !== "all") {
            const label = CATEGORY_MAP[selectedCategory]?.label || selectedCategory;
            chipsHTML += `<span class="filter-chip" id="chip-cat"><i class="fa-solid fa-microchip"></i> Category: ${label} <i class="fa-solid fa-xmark"></i></span>`;
        }

        if (selectedStores.length < 3) {
            selectedStores.forEach(s => {
                chipsHTML += `<span class="filter-chip" data-store="${s}"><i class="fa-solid fa-store"></i> ${s} <i class="fa-solid fa-xmark"></i></span>`;
            });
        }

        if (stockOnly) {
            chipsHTML += `<span class="filter-chip" id="chip-stock"><i class="fa-solid fa-circle-check"></i> In Stock <i class="fa-solid fa-xmark"></i></span>`;
        }

        if (currentFilterMin > dataPriceMin || currentFilterMax < dataPriceMax) {
            chipsHTML += `<span class="filter-chip" id="chip-price"><i class="fa-solid fa-coins"></i> ${currentFilterMin}JOD - ${currentFilterMax}JOD <i class="fa-solid fa-xmark"></i></span>`;
        }

        activeChipsContainer.innerHTML = chipsHTML;

        // Add click events to remove individual filters
        const chips = activeChipsContainer.querySelectorAll(".filter-chip");
        chips.forEach(chip => {
            chip.addEventListener("click", () => {
                if (chip.id === "chip-cat") {
                    selectedCategory = "all";
                    const allCatBtn = categoryFilterList.querySelector('[data-category="all"]');
                    if (allCatBtn) {
                        categoryFilterList.querySelectorAll(".btn-category").forEach(b => b.classList.remove("active"));
                        allCatBtn.classList.add("active");
                    }
                } else if (chip.id === "chip-stock") {
                    stockOnly = false;
                    stockToggle.checked = false;
                } else if (chip.id === "chip-price") {
                    currentFilterMin = dataPriceMin;
                    currentFilterMax = dataPriceMax;
                    priceMinInput.value = dataPriceMin;
                    priceMaxInput.value = dataPriceMax;
                    sliderMin.value = dataPriceMin;
                    sliderMax.value = dataPriceMax;
                    updateSliderTrack();
                } else {
                    const storeName = chip.getAttribute("data-store");
                    if (storeName) {
                        selectedStores = selectedStores.filter(s => s !== storeName);
                        storeFilters.forEach(cb => {
                            if (cb.value === storeName) cb.checked = false;
                        });
                    }
                }
                currentPage = 1;
                applyFiltersAndSorting();
            });
        });
    }

    // ================= 3. DOM RENDERING LOGIC =================
    function renderProductsCatalog() {
        gridContainer.innerHTML = "";

        if (filteredProducts.length === 0) {
            gridContainer.innerHTML = `
                <div class="catalog-empty-state">
                    <i class="fa-solid fa-box-open"></i>
                    <h3>No Components Match Your Criteria</h3>
                    <p>Try clearing your search keyword, adjusting your price limits, or toggling additional stores.</p>
                </div>
            `;
            paginationPanel.innerHTML = "";
            return;
        }

        // Pagination slicing
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredProducts.length);
        const pageItems = filteredProducts.slice(startIndex, endIndex);

        pageItems.forEach((product, index) => {
            const isCompared = comparedProducts.some(p => p.URL === product.URL);

            // Clean up Name formatting
            let cardTitle = product["Full Name"];

            // Search highlighting logic
            if (searchQuery) {
                const terms = searchQuery.toLowerCase().split(/\s+/);
                terms.forEach(term => {
                    if (term) {
                        const regex = new RegExp(`(${escapeRegExp(term)})`, "gi");
                        cardTitle = cardTitle.replace(regex, `<span class="card-title-highlighted">$1</span>`);
                    }
                });
            }

            const isOutOfStock = product.Status === "Out of Stock";
            const isComingSoon = product.Status === "Coming Soon";

            let stockIndicatorClass = "in-stock-indicator";
            let stockTextClass = "stock-text-in";
            if (isOutOfStock) {
                stockIndicatorClass = "out-stock-indicator";
                stockTextClass = "stock-text-out";
            } else if (isComingSoon) {
                stockIndicatorClass = "coming-soon-indicator";
                stockTextClass = "stock-text-coming";
            }

            const priceText = product.Price || `${product.price_val.toFixed(2)} JOD`;

            // Determine dynamic store classes
            let storeClass = "card-igeek";
            let storeBadge = "badge-igeek";
            if (product["Website Name"] === "City Center") {
                storeClass = "card-citycenter";
                storeBadge = "badge-citycenter";
            } else if (product["Website Name"] === "Oriental Store") {
                storeClass = "card-osjo";
                storeBadge = "badge-osjo";
            } else if (product["Website Name"] === "PC Circle") {
                storeClass = "card-pccircle";
                storeBadge = "badge-pccircle";
            } else if (product["Website Name"] === "Taipei Computer") {
                storeClass = "card-taipei";
                storeBadge = "badge-taipei";
            } else if (product["Website Name"] === "MCC Jordan") {
                storeClass = "card-mcc";
                storeBadge = "badge-mcc";
            } else if (product["Website Name"] === "Game On Jordan") {
                storeClass = "card-gameon";
                storeBadge = "badge-gameon";
            }

            const cardHTML = `
                <div class="product-card ${storeClass} glass-panel">
                    <div class="card-top">
                        <span class="card-store-badge ${storeBadge}">${product["Website Name"]}</span>
                        <span class="card-category-badge">${product.category_key}</span>
                    </div>
                    
                    <div class="card-image-wrapper">
                        ${product["Image URL"] ? `
                            <img class="card-image" src="${product["Image URL"]}" alt="${product["Full Name"]}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        ` : ''}
                        <div class="card-image-fallback" style="${product["Image URL"] ? 'display: none;' : 'display: flex;'}">
                            <i class="fa-solid ${CATEGORY_MAP[product.category_key]?.icon || 'fa-microchip'} fallback-icon"></i>
                        </div>
                    </div>
                    
                    <div class="card-middle">
                        <h4 class="card-title" title="${product["Full Name"]}">${cardTitle}</h4>
                        
                        <!-- Specs Pill Row -->
                        ${(product.category_key === "Monitor") ? `
                            <div class="card-specs-row">
                                ${product.screen_size ? `<span class="spec-pill spec-inches"><i class="fa-solid fa-expand"></i> ${product.screen_size}"</span>` : ''}
                                ${product.refresh_rate ? `<span class="spec-pill spec-hz"><i class="fa-solid fa-gauge-high"></i> ${product.refresh_rate}Hz</span>` : ''}
                                ${product.response_time ? `<span class="spec-pill spec-ms"><i class="fa-solid fa-bolt"></i> ${product.response_time}ms</span>` : ''}
                            </div>
                        ` : (product.category_key === "Monitor Arm") ? `
                            <div class="card-specs-row">
                                ${product.arms_supported ? `<span class="spec-pill spec-arms"><i class="fa-solid fa-circle-nodes"></i> ${product.arms_supported === 1 ? 'Single Arm' : product.arms_supported === 2 ? 'Dual Arm' : product.arms_supported === 3 ? 'Triple Arm' : product.arms_supported + ' Arms'}</span>` : ''}
                                ${product.weight_support ? `<span class="spec-pill spec-weight"><i class="fa-solid fa-weight-hanging"></i> Max ${String(product.weight_support).toLowerCase().includes('kg') ? product.weight_support : product.weight_support + 'kg'}</span>` : ''}
                            </div>
                        ` : ''}

                        <div class="card-stock-row">
                            <span class="stock-indicator ${stockIndicatorClass}"></span>
                            <span class="${stockTextClass}">${product.Status}</span>
                        </div>
                    </div>
                    
                    <div class="card-bottom">
                        <div class="card-price-row">
                            <span class="card-price">${priceText}</span>
                        </div>
                        <div class="card-actions">
                            <a href="${product.URL}" target="_blank" class="btn-card-action btn-card-visit">
                                <i class="fa-solid fa-arrow-up-right-from-square"></i> Visit Store
                            </a>
                            <button class="btn-card-action btn-card-compare ${isCompared ? "active" : ""}" data-index="${startIndex + index}" title="Compare this item">
                                <i class="fa-solid ${isCompared ? "fa-circle-check" : "fa-scale-balanced"}"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            gridContainer.insertAdjacentHTML("beforeend", cardHTML);
        });

        // Add compare toggle click handlers
        const compareBtns = gridContainer.querySelectorAll(".btn-card-compare");
        compareBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const productIndex = parseInt(btn.getAttribute("data-index"));
                const product = filteredProducts[productIndex];
                toggleCompareProduct(product, btn);
            });
        });

        renderPaginationUI();
    }

    function renderPaginationUI() {
        paginationPanel.innerHTML = "";
        const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

        if (totalPages <= 1) return;

        // Previous Button
        const prevBtn = document.createElement("button");
        prevBtn.className = "btn-page";
        prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener("click", () => {
            currentPage--;
            renderProductsCatalog();
            window.scrollTo({ top: gridContainer.offsetTop - 100, behavior: "smooth" });
        });
        paginationPanel.appendChild(prevBtn);

        // Dynamic page indexes rendering (handling high page numbers with ellipses)
        let pageNumbers = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
        } else {
            if (currentPage <= 4) {
                pageNumbers = [1, 2, 3, 4, 5, "...", totalPages];
            } else if (currentPage >= totalPages - 3) {
                pageNumbers = [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
            } else {
                pageNumbers = [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
            }
        }

        pageNumbers.forEach(page => {
            if (page === "...") {
                const span = document.createElement("span");
                span.className = "pagination-ellipsis";
                span.textContent = "...";
                paginationPanel.appendChild(span);
            } else {
                const btn = document.createElement("button");
                btn.className = `btn-page ${page === currentPage ? "active" : ""}`;
                btn.textContent = page;
                btn.addEventListener("click", () => {
                    currentPage = page;
                    renderProductsCatalog();
                    window.scrollTo({ top: gridContainer.offsetTop - 100, behavior: "smooth" });
                });
                paginationPanel.appendChild(btn);
            }
        });

        // Next Button
        const nextBtn = document.createElement("button");
        nextBtn.className = "btn-page";
        nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener("click", () => {
            currentPage++;
            renderProductsCatalog();
            window.scrollTo({ top: gridContainer.offsetTop - 100, behavior: "smooth" });
        });
        paginationPanel.appendChild(nextBtn);
    }

    // ================= 4. COMPARISON TRAY & MODAL LOGIC =================
    function toggleCompareProduct(product, btnElement) {
        const existingIdx = comparedProducts.findIndex(p => p.URL === product.URL);

        if (existingIdx > -1) {
            // Already inside comparison tray, remove it
            comparedProducts.splice(existingIdx, 1);
            if (btnElement) btnElement.classList.remove("active");
            showNotification(`Removed component from comparison list.`);
        } else {
            // Add to comparison tray
            if (comparedProducts.length >= 3) {
                showNotification("⚠️ Maximum comparison reached! Clear items first.", "error");
                return;
            }
            comparedProducts.push(product);
            if (btnElement) btnElement.classList.add("active");
            showNotification(`Added '${product["Full Name"].substring(0, 30)}...' to comparison tray.`);
        }

        updateCompareTrayUI();
    }

    function updateCompareTrayUI() {
        compareCountBadge.textContent = comparedProducts.length;

        // Empty compare Slots container
        compareSlots.innerHTML = "";

        for (let i = 0; i < 3; i++) {
            const product = comparedProducts[i];
            const slot = document.createElement("div");

            if (product) {
                slot.className = "compare-slot filled";

                let storeLabelClass = "badge-igeek";
                if (product["Website Name"] === "City Center") storeLabelClass = "badge-citycenter";
                else if (product["Website Name"] === "Oriental Store") storeLabelClass = "badge-osjo";
                else if (product["Website Name"] === "PC Circle") storeLabelClass = "badge-pccircle";
                else if (product["Website Name"] === "Taipei Computer") storeLabelClass = "badge-taipei";
                else if (product["Website Name"] === "MCC Jordan") storeLabelClass = "badge-mcc";
                else if (product["Website Name"] === "Game On Jordan") storeLabelClass = "badge-gameon";

                slot.innerHTML = `
                    <div class="slot-filled-content">
                        <span class="slot-title" title="${product["Full Name"]}">${product["Full Name"]}</span>
                        <div class="slot-meta">
                            <span class="slot-store ${storeLabelClass}">${product["Website Name"]}</span>
                            <span class="slot-price">${product.Price}</span>
                        </div>
                    </div>
                    <button class="btn-remove-slot" data-index="${i}"><i class="fa-solid fa-xmark"></i></button>
                `;

                slot.querySelector(".btn-remove-slot").addEventListener("click", (e) => {
                    e.stopPropagation();
                    comparedProducts.splice(i, 1);
                    updateCompareTrayUI();
                    renderProductsCatalog(); // Refresh grids active classes
                });

            } else {
                slot.className = "compare-slot";
                slot.innerHTML = `
                    <div class="slot-empty-text">
                        <i class="fa-solid fa-circle-plus"></i> Slot ${i + 1}
                    </div>
                `;
            }

            compareSlots.appendChild(slot);
        }

        // Slide up / Open comparison tray if at least 1 item is added
        if (comparedProducts.length > 0) {
            compareTray.classList.add("open");
        } else {
            compareTray.classList.remove("open");
        }

        // Enable or disable Compare button
        if (comparedProducts.length >= 2) {
            btnTriggerCompare.removeAttribute("disabled");
        } else {
            btnTriggerCompare.setAttribute("disabled", "true");
        }
    }

    function openCompareModal() {
        if (comparedProducts.length < 2) return;

        // Clean table columns except the first label cells
        const headerRow = document.getElementById("compare-row-headers");
        const imageRow = document.getElementById("compare-row-image");
        const storeRow = document.getElementById("compare-row-store");
        const categoryRow = document.getElementById("compare-row-category");
        const nameRow = document.getElementById("compare-row-name");
        const priceRow = document.getElementById("compare-row-price");
        const sizeRow = document.getElementById("compare-row-size");
        const hzRow = document.getElementById("compare-row-hz");
        const msRow = document.getElementById("compare-row-ms");
        const armsRow = document.getElementById("compare-row-arms");
        const weightRow = document.getElementById("compare-row-weight");
        const statusRow = document.getElementById("compare-row-status");
        const actionRow = document.getElementById("compare-row-action");

        headerRow.innerHTML = '<th class="attr-header">Attributes</th>';
        imageRow.innerHTML = '<td class="attr-label">Product Image</td>';
        storeRow.innerHTML = '<td class="attr-label">Store Origin</td>';
        categoryRow.innerHTML = '<td class="attr-label">Category</td>';
        nameRow.innerHTML = '<td class="attr-label">Product Name</td>';
        priceRow.innerHTML = '<td class="attr-label">Price (JOD)</td>';
        sizeRow.innerHTML = '<td class="attr-label">Screen Size (Inches)</td>';
        hzRow.innerHTML = '<td class="attr-label">Refresh Rate (Hz)</td>';
        msRow.innerHTML = '<td class="attr-label">Response Time (ms)</td>';
        armsRow.innerHTML = '<td class="attr-label">Arms Supported</td>';
        weightRow.innerHTML = '<td class="attr-label">Weight Capacity (kg)</td>';
        statusRow.innerHTML = '<td class="attr-label">Stock Status</td>';
        actionRow.innerHTML = '<td class="attr-label">Store Page</td>';

        comparedProducts.forEach(item => {
            // Store badge class
            let storeBadge = "badge-igeek";
            if (item["Website Name"] === "City Center") storeBadge = "badge-citycenter";
            else if (item["Website Name"] === "Oriental Store") storeBadge = "badge-osjo";
            else if (item["Website Name"] === "PC Circle") storeBadge = "badge-pccircle";
            else if (item["Website Name"] === "Taipei Computer") storeBadge = "badge-taipei";
            else if (item["Website Name"] === "MCC Jordan") storeBadge = "badge-mcc";
            else if (item["Website Name"] === "Game On Jordan") storeBadge = "badge-gameon";

            const isOutOfStock = item.Status === "Out of Stock";
            const isComingSoon = item.Status === "Coming Soon";

            // Image cell injection
            let compareImageHTML = "";
            if (item["Image URL"]) {
                compareImageHTML = `
                    <div class="compare-image-wrapper">
                        <img class="compare-image" src="${item["Image URL"]}" alt="${item["Full Name"]}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="compare-image-fallback" style="display:none;">
                            <i class="fa-solid ${CATEGORY_MAP[item.category_key]?.icon || 'fa-desktop'} fallback-icon"></i>
                        </div>
                    </div>
                `;
            } else {
                compareImageHTML = `
                    <div class="compare-image-wrapper">
                        <div class="compare-image-fallback">
                            <i class="fa-solid ${CATEGORY_MAP[item.category_key]?.icon || 'fa-desktop'} fallback-icon"></i>
                        </div>
                    </div>
                `;
            }

            headerRow.insertAdjacentHTML("beforeend", `<th class="compare-col-header">${item["Full Name"].substring(0, 40)}...</th>`);
            imageRow.insertAdjacentHTML("beforeend", `<td class="compare-item-cell cell-image-cell">${compareImageHTML}</td>`);
            storeRow.insertAdjacentHTML("beforeend", `<td class="compare-item-cell"><span class="card-store-badge ${storeBadge}">${item["Website Name"]}</span></td>`);
            categoryRow.insertAdjacentHTML("beforeend", `<td class="compare-item-cell" style="font-weight:600;">${item.category_key}</td>`);
            nameRow.insertAdjacentHTML("beforeend", `<td class="compare-item-cell" style="font-size:0.85rem;text-align:left;">${item["Full Name"]}</td>`);
            priceRow.insertAdjacentHTML("beforeend", `<td class="compare-item-cell cell-price">${item.Price}</td>`);

            // Specialized specifications cells
            sizeRow.insertAdjacentHTML("beforeend", `<td class="compare-item-cell">${item.screen_size ? item.screen_size + '"' : 'N/A'}</td>`);
            hzRow.insertAdjacentHTML("beforeend", `<td class="compare-item-cell">${item.refresh_rate ? item.refresh_rate + 'Hz' : 'N/A'}</td>`);
            msRow.insertAdjacentHTML("beforeend", `<td class="compare-item-cell">${item.response_time ? item.response_time + 'ms' : 'N/A'}</td>`);

            let armsLabel = 'N/A';
            if (item.arms_supported) {
                armsLabel = item.arms_supported === 1 ? "1 (Single)" : item.arms_supported === 2 ? "2 (Dual)" : item.arms_supported === 3 ? "3 (Triple)" : item.arms_supported;
            }
            armsRow.insertAdjacentHTML("beforeend", `<td class="compare-item-cell">${armsLabel}</td>`);
            weightRow.insertAdjacentHTML("beforeend", `<td class="compare-item-cell">${item.weight_support ? (String(item.weight_support).toLowerCase().includes('kg') ? item.weight_support : item.weight_support + ' kg') : 'N/A'}</td>`);

            let statusTextClass = "stock-text-in";
            let statusIconClass = "fa-circle-check";
            if (isOutOfStock) {
                statusTextClass = "stock-text-out";
                statusIconClass = "fa-circle-xmark";
            } else if (isComingSoon) {
                statusTextClass = "stock-text-coming";
                statusIconClass = "fa-circle-question";
            }

            statusRow.insertAdjacentHTML("beforeend", `<td class="compare-item-cell">
                <span class="${statusTextClass}">
                    <i class="fa-solid ${statusIconClass}"></i> ${item.Status}
                </span>
            </td>`);
            actionRow.insertAdjacentHTML("beforeend", `<td class="compare-item-cell cell-action">
                <a href="${item.URL}" target="_blank" class="btn-modal-visit">
                    <i class="fa-solid fa-shopping-cart"></i> View Page
                </a>
            </td>`);
        });

        compareModal.classList.add("open");
    }

    // ================= 5. EVENT LISTENERS =================

    // Toggle Compare Tray manually clicking header
    compareTrayToggle.addEventListener("click", () => {
        if (comparedProducts.length === 0) return;

        if (compareTray.style.bottom === "0px" || compareTray.classList.contains("open")) {
            compareTray.classList.remove("open");
            trayChevron.className = "fa-solid fa-chevron-up";
        } else {
            compareTray.classList.add("open");
            trayChevron.className = "fa-solid fa-chevron-down";
        }
    });

    // Back to Categories button
    if (btnBackCategories) {
        btnBackCategories.addEventListener("click", goBackToHomepage);
    }

    // Reset All filters button
    btnResetFilters.addEventListener("click", () => {
        // Reset Search
        searchQuery = "";
        if (headerSearchBar) headerSearchBar.value = "";

        // Reset Category
        selectedCategory = "all";
        const allCatBtn = categoryFilterList.querySelector('[data-category="all"]');
        categoryFilterList.querySelectorAll(".btn-category").forEach(b => b.classList.remove("active"));
        if (allCatBtn) allCatBtn.classList.add("active");

        // Reset Price
        currentFilterMin = dataPriceMin;
        currentFilterMax = dataPriceMax;
        priceMinInput.value = dataPriceMin;
        priceMaxInput.value = dataPriceMax;
        sliderMin.value = dataPriceMin;
        sliderMax.value = dataPriceMax;
        updateSliderTrack();

        // Reset Stock toggle
        stockOnly = false;
        stockToggle.checked = false;

        // Reset Spec Filters
        activeSpecFilters.clear();
        const specGroup = document.getElementById("spec-filter-group");
        if (specGroup) specGroup.style.display = "none";

        currentPage = 1;
        applyFiltersAndSorting();
        showNotification("Filters have been completely reset.");
    });

    // Store Checkbox filters — no longer in sidebar, all stores always active


    // Stock toggle clicking
    stockToggle.addEventListener("change", () => {
        stockOnly = stockToggle.checked;
        currentPage = 1;
        applyFiltersAndSorting();
    });

    // Sorting selection change
    sortSelect.addEventListener("change", () => {
        sortBy = sortSelect.value;
        currentPage = 1;
        applyFiltersAndSorting();
    });

    // Price double sliders sliding logic
    sliderMin.addEventListener("input", () => {
        let val1 = parseInt(sliderMin.value);
        let val2 = parseInt(sliderMax.value);

        if (val1 >= val2) {
            sliderMin.value = val2 - 10;
            val1 = val2 - 10;
        }

        currentFilterMin = val1;
        priceMinInput.value = val1;
        updateSliderTrack();

        clearTimeout(typingTimer);
        typingTimer = setTimeout(applyFiltersAndSorting, 150);
    });

    sliderMax.addEventListener("input", () => {
        let val1 = parseInt(sliderMin.value);
        let val2 = parseInt(sliderMax.value);

        if (val2 <= val1) {
            sliderMax.value = val1 + 10;
            val2 = val1 + 10;
        }

        currentFilterMax = val2;
        priceMaxInput.value = val2;
        updateSliderTrack();

        clearTimeout(typingTimer);
        typingTimer = setTimeout(applyFiltersAndSorting, 150);
    });

    // Direct price inputs typing
    priceMinInput.addEventListener("change", () => {
        let val = parseInt(priceMinInput.value);
        if (isNaN(val) || val < dataPriceMin) val = dataPriceMin;
        if (val >= currentFilterMax) val = currentFilterMax - 10;

        currentFilterMin = val;
        sliderMin.value = val;
        updateSliderTrack();
        applyFiltersAndSorting();
    });

    priceMaxInput.addEventListener("change", () => {
        let val = parseInt(priceMaxInput.value);
        if (isNaN(val) || val > dataPriceMax) val = dataPriceMax;
        if (val <= currentFilterMin) val = currentFilterMin + 10;

        currentFilterMax = val;
        sliderMax.value = val;
        updateSliderTrack();
        applyFiltersAndSorting();
    });

    // Compare Triggers
    btnTriggerCompare.addEventListener("click", openCompareModal);
    btnClearCompareAll.addEventListener("click", () => {
        comparedProducts = [];
        updateCompareTrayUI();
        renderProductsCatalog();
        showNotification("Cleared comparison slots.");
    });

    // Close Compare modal
    btnCloseCompareModal.addEventListener("click", () => {
        compareModal.classList.remove("open");
    });
    compareModal.addEventListener("click", (e) => {
        if (e.target === compareModal) {
            compareModal.classList.remove("open");
        }
    });

    // Helper functions
    function updateSliderTrack() {
        const percent1 = ((sliderMin.value - dataPriceMin) / (dataPriceMax - dataPriceMin)) * 100;
        const percent2 = ((sliderMax.value - dataPriceMin) / (dataPriceMax - dataPriceMin)) * 100;
        sliderTrack.style.left = percent1 + "%";
        sliderTrack.style.width = (percent2 - percent1) + "%";
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    // Toast Notification popup (theme-aware)
    function showNotification(message, type = "success") {
        const toast = document.createElement("div");
        toast.innerHTML = `
            <i class="fa-solid ${type === "error" ? "fa-circle-exclamation" : "fa-circle-check"}"></i>
            <span>${message}</span>
        `;

        const isDark = document.body.classList.contains("dark-theme");
        const isError = type === "error";

        Object.assign(toast.style, {
            position: "fixed",
            top: "86px",
            right: "24px",
            background: isDark ? "#1e2235" : "#ffffff",
            border: `1.5px solid ${isError ? "#ef4444" : "#f97316"}`,
            color: isDark ? "#f1f5f9" : "#1a1a2e",
            padding: "13px 18px",
            borderRadius: "10px",
            fontSize: "0.875rem",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            zIndex: "99999",
            opacity: "0",
            transform: "translateX(20px)",
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.15)",
            fontFamily: "Inter, sans-serif"
        });

        toast.querySelector("i").style.color = isError ? "#ef4444" : "#f97316";

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "1";
            toast.style.transform = "translateX(0)";
        }, 40);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(20px)";
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }

    // RUN ON LOAD
    loadProductCatalog();
});
