"""
System Info Tool - Backend Logic
Provides system information including time, battery status, and hardware details.
"""

import platform
import psutil
import datetime
import json
from typing import Dict, Any

def get_tool_info():
    """Return tool metadata"""
    return {
        'name': 'System Info',
        'description': 'Real-time system information including clock, battery status, and hardware details',
        'category': 'system',
        'icon': '🖥️',
        'version': '1.0.0',
        'has_panels': True,
        'panels': ['battery', 'clock', 'pc-details', 'network'],
        'endpoints': [
            'GET /api/dev-tool-system-info/time',
            'GET /api/dev-tool-system-info/battery',
            'GET /api/dev-tool-system-info/hardware',
            'GET /api/dev-tool-system-info/os',
            'GET /api/dev-tool-system-info/network'
        ]
    }

def get_current_time() -> Dict[str, Any]:
    """Get current time information"""
    now = datetime.datetime.now()
    return {
        'timestamp': now.isoformat(),
        'date': now.strftime('%Y-%m-%d'),
        'time': now.strftime('%H:%M:%S'),
        'day': now.strftime('%A'),
        'month': now.strftime('%B'),
        'year': now.year,
        'timezone': str(now.tzinfo) if now.tzinfo else 'Local',
        'utc_offset': now.utcoffset().total_seconds() / 3600 if now.utcoffset() else 0
    }

def get_battery_info() -> Dict[str, Any]:
    """Get comprehensive battery information"""
    try:
        battery = psutil.sensors_battery()
        if battery is None:
            return {
                'available': False,
                'error': 'Battery information not available (likely desktop system)'
            }

        return {
            'available': True,
            'percent': round(battery.percent, 1),
            'charging': battery.power_plugged,
            'time_left': battery.secsleft if battery.secsleft != psutil.POWER_TIME_UNLIMITED else None,
            'time_left_formatted': format_time_left(battery.secsleft),
            'power_plugged': battery.power_plugged,
            'critical': battery.percent < 10 and not battery.power_plugged
        }
    except Exception as e:
        return {
            'available': False,
            'error': str(e)
        }

def format_time_left(seconds: int) -> str:
    """Format seconds into human readable time"""
    if seconds == psutil.POWER_TIME_UNLIMITED:
        return "Unlimited"
    elif seconds < 0:
        return "Unknown"

    hours, remainder = divmod(seconds, 3600)
    minutes, seconds = divmod(remainder, 60)

    if hours > 0:
        return f"{hours}h {minutes}m"
    elif minutes > 0:
        return f"{minutes}m {seconds}s"
    else:
        return f"{seconds}s"

def get_hardware_info() -> Dict[str, Any]:
    """Get comprehensive hardware information"""
    try:
        # CPU information
        cpu_info = {
            'physical_cores': psutil.cpu_count(logical=False),
            'logical_cores': psutil.cpu_count(logical=True),
            'cpu_freq_current': psutil.cpu_freq().current if psutil.cpu_freq() else None,
            'cpu_freq_min': psutil.cpu_freq().min if psutil.cpu_freq() else None,
            'cpu_freq_max': psutil.cpu_freq().max if psutil.cpu_freq() else None,
            'cpu_percent': psutil.cpu_percent(interval=1),
            'cpu_percent_per_core': psutil.cpu_percent(interval=1, percpu=True)
        }

        # Memory information
        memory = psutil.virtual_memory()
        memory_info = {
            'total_gb': round(memory.total / (1024**3), 2),
            'available_gb': round(memory.available / (1024**3), 2),
            'used_gb': round(memory.used / (1024**3), 2),
            'percentage': memory.percent,
            'cached_gb': round(getattr(memory, 'cached', 0) / (1024**3), 2),
            'buffers_gb': round(getattr(memory, 'buffers', 0) / (1024**3), 2)
        }

        # Disk information
        disk_info = []
        for partition in psutil.disk_partitions():
            try:
                usage = psutil.disk_usage(partition.mountpoint)
                disk_info.append({
                    'device': partition.device,
                    'mountpoint': partition.mountpoint,
                    'filesystem': partition.fstype,
                    'total_gb': round(usage.total / (1024**3), 2),
                    'used_gb': round(usage.used / (1024**3), 2),
                    'free_gb': round(usage.free / (1024**3), 2),
                    'percentage': usage.percent
                })
            except PermissionError:
                continue

        return {
            'cpu': cpu_info,
            'memory': memory_info,
            'disks': disk_info
        }
    except Exception as e:
        return {
            'error': str(e)
        }

def get_os_info() -> Dict[str, Any]:
    """Get comprehensive OS information"""
    try:
        return {
            'system': platform.system(),
            'release': platform.release(),
            'version': platform.version(),
            'machine': platform.machine(),
            'processor': platform.processor(),
            'architecture': platform.architecture(),
            'hostname': platform.node(),
            'python_version': platform.python_version(),
            'boot_time': datetime.datetime.fromtimestamp(psutil.boot_time()).isoformat(),
            'uptime_seconds': int(datetime.datetime.now().timestamp() - psutil.boot_time()),
            'users': [{'name': user.name, 'terminal': user.terminal, 'host': user.host,
                      'started': datetime.datetime.fromtimestamp(user.started).isoformat()}
                     for user in psutil.users()]
        }
    except Exception as e:
        return {
            'error': str(e)
        }

def get_network_info() -> Dict[str, Any]:
    """Get comprehensive network interface information"""
    try:
        network_info = []
        interfaces = psutil.net_if_addrs()
        stats = psutil.net_if_stats()
        counters = psutil.net_io_counters(pernic=True)

        for interface_name, addresses in interfaces.items():
            interface_info = {
                'name': interface_name,
                'addresses': [],
                'stats': {},
                'counters': {}
            }

            # Get addresses
            for addr in addresses:
                if addr.family.name == 'AF_INET':  # IPv4
                    interface_info['addresses'].append({
                        'family': 'IPv4',
                        'address': addr.address,
                        'netmask': addr.netmask,
                        'broadcast': addr.broadcast
                    })
                elif addr.family.name == 'AF_INET6':  # IPv6
                    interface_info['addresses'].append({
                        'family': 'IPv6',
                        'address': addr.address,
                        'netmask': addr.netmask
                    })
                elif addr.family.name == 'AF_PACKET':  # MAC address
                    interface_info['addresses'].append({
                        'family': 'MAC',
                        'address': addr.address
                    })

            # Get interface stats
            if interface_name in stats:
                stat = stats[interface_name]
                interface_info['stats'] = {
                    'isup': stat.isup,
                    'duplex': stat.duplex,
                    'speed': stat.speed,
                    'mtu': stat.mtu
                }

            # Get network counters
            if interface_name in counters:
                counter = counters[interface_name]
                interface_info['counters'] = {
                    'bytes_sent': counter.bytes_sent,
                    'bytes_recv': counter.bytes_recv,
                    'packets_sent': counter.packets_sent,
                    'packets_recv': counter.packets_recv,
                    'errin': counter.errin,
                    'errout': counter.errout,
                    'dropin': counter.dropin,
                    'dropout': counter.dropout
                }

            network_info.append(interface_info)

        return {
            'interfaces': network_info,
            'total_counters': {
                'bytes_sent': psutil.net_io_counters().bytes_sent,
                'bytes_recv': psutil.net_io_counters().bytes_recv,
                'packets_sent': psutil.net_io_counters().packets_sent,
                'packets_recv': psutil.net_io_counters().packets_recv
            }
        }
    except Exception as e:
        return {
            'error': str(e)
        }