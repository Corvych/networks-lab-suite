import { icons } from '../core/icons.js';

export const labsRegistry = [
  {
    id: 'lab-1',
    number: 1,
    title: 'Модуляция (AM, DSB, SSB) и цифровые манипуляции (ASK, FSK, PSK)',
    subtitle: 'Физический уровень: несущая, модулятор/манипулятор, спектры AM/ASK/FSK/PSK',
    category: 'Физический уровень',
    layerKey: 'physical',
    accentColor: '#00f0ff',
    icon: icons.waveform,
    difficulty: 'Базовый',
    estimatedTime: '45 мин',
    status: 'available',
    description: 'Интерактивная схемотехническая лаборатория с drag-and-drop холстом блоков (источник: тон/речь/биты, несущая, модулятор/манипулятор, полосовой фильтр, детектор), осциллографом и спектрографом для исследования аналоговой АМ (DSB/SSB) и дискретных манипуляций (ASK, FSK, PSK).',
    objectives: [
      'Построение тракта передачи на интерактивном схемотехническом холсте',
      'Формирование и сравнение аналоговых сигналов DSB-FC (AM), DSB-SC, SSB-USB и SSB-LSB',
      'Исследование цифровых манипуляций: амплитудной (ASK/OOK), частотной (FSK) и фазовой (BPSK)',
      'Спектральный анализ сигналов манипуляции при передаче двоичной последовательности бит',
      'Оценка влияния ширины полосы пропускания канала и шума на качество демодуляции'
    ]
  },
  {
    id: 'lab-2',
    number: 2,
    title: 'Канальный уровень: Ethernet-кадры и контроль ошибок (CRC-32 / Хэмминг)',
    subtitle: 'Канальный уровень (Data Link): кадры IEEE 802.3, MAC-адресация, FCS',
    category: 'Канальный уровень',
    layerKey: 'datalink',
    accentColor: '#a855f7',
    icon: icons.packet,
    difficulty: 'Средний',
    estimatedTime: '60 мин',
    status: 'soon',
    description: 'Изучение структуры кадра Ethernet II, расчет циклического избыточного кода CRC-32 полиномиальным делением и коррекция битовых ошибок кодом Хэмминга.',
    objectives: [
      'Анатомия Ethernet-кадра: Pre, SFD, MAC Source/Dest, Type/Length, FCS',
      'Побитовое вычисление полиномиальной контрольной суммы CRC-32',
      'Обнаружение одиночных и двойных инверсий битов',
      'Построение матрицы синдромов кода Хэмминга (7,4)'
    ]
  },
  {
    id: 'lab-3',
    number: 3,
    title: 'IP-адресация, разбиение на подсети (VLSM) и маршрутизация',
    subtitle: 'Сетевой уровень: IPv4, CIDR, VLSM, таблицы маршрутизации',
    category: 'Сетевой уровень',
    layerKey: 'network',
    accentColor: '#3b82f6',
    icon: icons.networkTopology,
    difficulty: 'Продвинутый',
    estimatedTime: '60 мин',
    status: 'soon',
    description: 'Расчет адресного пространства корпоративной сети, проектирование бесклассовых подсетей переменной длины (VLSM) и моделирование hop-by-hop маршрутизации.',
    objectives: [
      'Двоичный расчет network address, broadcast address и host range',
      'Оптимальное деление сети на подсети заданных размеров (VLSM)',
      'Анализ таблицы маршрутизации по принципу Longest Prefix Match',
      'Построение схемы адресации филиальной сети'
    ]
  },
  {
    id: 'lab-4',
    number: 4,
    title: 'Диагностика сети и протоколы разрешения: ARP, ICMP Ping и Traceroute',
    subtitle: 'Сетевой уровень: ARP-таблицы, ICMP echo/TTL expired',
    category: 'Сетевой уровень',
    layerKey: 'network',
    accentColor: '#3b82f6',
    icon: icons.router,
    difficulty: 'Базовый',
    estimatedTime: '40 мин',
    status: 'soon',
    description: 'Интерактивное моделирование разрешения IP-MAC с помощью протокола ARP, механизма работы ping и отслеживания маршрута пакетов (Traceroute) по полю TTL.',
    objectives: [
      'Широковещательные запросы ARP Request и кэширование ARP Reply',
      'Эхо-запросы и ответы ICMP (Type 8 / Type 0)',
      'Изучение механизма декремента TTL и сообщений Time Exceeded',
      'Анализ RTT (Round Trip Time) и джиттера'
    ]
  },
  {
    id: 'lab-5',
    number: 5,
    title: 'Транспортный уровень: TCP 3-Way Handshake, скользящее окно и контроль потока',
    subtitle: 'Транспортный уровень: TCP vs UDP, флаги SYN/ACK/FIN, Congestion Control',
    category: 'Транспортный уровень',
    layerKey: 'transport',
    accentColor: '#10b981',
    icon: icons.shieldCheck,
    difficulty: 'Продвинутый',
    estimatedTime: '75 мин',
    status: 'soon',
    description: 'Визуализация трехэтапного рукопожатия TCP (SYN, SYN-ACK, ACK), динамика размера скользящего окна (Sliding Window) и алгоритмы Slow Start / Congestion Avoidance.',
    objectives: [
      'Пошаговая анимация установки и закрытия TCP-соединения',
      'Отслеживание номеров Sequence Number (SEQ) и Acknowledgment (ACK)',
      'Моделирование потерь сегментов и повторной передачи (Retransmission)',
      'График изменения окна перегрузки (CWND) в зависимости от RTT'
    ]
  },
  {
    id: 'lab-6',
    number: 6,
    title: 'Прикладные протоколы и сетевые сервисы: DNS, HTTP/HTTPS и DHCP',
    subtitle: 'Прикладной уровень: иерархия DNS, семантика HTTP/1.1 и HTTP/2, DORA',
    category: 'Прикладной уровень',
    layerKey: 'application',
    accentColor: '#f59e0b',
    icon: icons.globe,
    difficulty: 'Средний',
    estimatedTime: '50 мин',
    status: 'soon',
    description: 'Исследование полного жизненного цикла веб-запроса: от получения IP через DHCP и рекурсивного резолвинга DNS до передачи HTTP-заголовков и TLS Handshake.',
    objectives: [
      'Четырехэтапная процедура DHCP (Discover, Offer, Request, Acknowledge)',
      'Итеративный и рекурсивный опрос DNS root, TLD и authoritative серверов',
      'Формирование HTTP GET/POST запросов и разбор кодов ответа (200, 301, 404)',
      'Сопоставление всех 7 уровней модели OSI в едином пакете данных'
    ]
  }
];

export function getLabById(id) {
  return labsRegistry.find(l => l.id === id || String(l.number) === String(id));
}
