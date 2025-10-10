"""
Dev Tool System Info - Core Logic
"""

import datetime
import psutil
import platform

def get_tool_info():
    """Return tool metadata"""
    return {
        'name': 'Dev Tool System Performance',
        'description': 'Show system performance metrics including CPU and memory usage',
        'category': 'system',
        'icon': '📊',
        'version': '1.0.0',
        'endpoints': [
            'GET /api/dev-tool-system-performance/info',
            'GET /api/dev-tool-system-performance/memory-usage'
        ]
    }

def get_system_info():
    """Get static welcome message with server system information"""
    # Get current time
    current_time = datetime.datetime.now()
    formatted_time = current_time.strftime("%B %d, %Y at %I:%M %p")
    # Get system information
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_count = psutil.cpu_count()
        memory = psutil.virtual_memory()
        memory_used_gb = round(memory.used / (1024**3), 2)
        memory_total_gb = round(memory.total / (1024**3), 2)
        memory_percent = memory.percent
        disk = psutil.disk_usage('/')
        disk_used_gb = round(disk.used / (1024**3), 2)
        disk_total_gb = round(disk.total / (1024**3), 2)
        disk_percent = round((disk.used / disk.total) * 100, 2)
        system_info = {
            'platform': platform.system(),
            'platform_release': platform.release(),
            'architecture': platform.machine(),
            'hostname': platform.node(),
            'python_version': platform.python_version()
        }
    except Exception as e:
        cpu_percent = 0
        cpu_count = 0
        memory_used_gb = 0
        memory_total_gb = 0
        memory_percent = 0
        disk_used_gb = 0
        disk_total_gb = 0
        disk_percent = 0
        system_info = {}
    return {
        'welcome_message': 'Welcome to Dev Tool System Info! Your server status and system information are displayed below.',
        'server_time': formatted_time,
        'status': 'Server running smoothly',
        'system_stats': {
            'cpu': {
                'usage_percent': cpu_percent,
                'core_count': cpu_count
            },
            'memory': {
                'used_gb': memory_used_gb,
                'total_gb': memory_total_gb,
                'usage_percent': memory_percent
            },
            'disk': {
                'used_gb': disk_used_gb,
                'total_gb': disk_total_gb,
                'usage_percent': disk_percent
            }
        },
        'system_info': system_info
    }

def get_memory_usage_by_process():
    """Get memory usage by process/applications"""
    try:
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'memory_info', 'cpu_percent']):
            try:
                # Get process memory and CPU info
                mem_info = proc.info['memory_info']
                if mem_info:
                    memory_mb = mem_info.rss / (1024 * 1024)  # Convert to MB
                    # Get CPU usage (this might be 0.0 for the first call, but will be accurate on subsequent calls)
                    try:
                        cpu_percent = proc.info.get('cpu_percent', 0.0) or 0.0
                    except:
                        cpu_percent = 0.0
                    
                    processes.append({
                        'pid': proc.info['pid'],
                        'name': proc.info['name'],
                        'memory_mb': round(memory_mb, 2),
                        'cpu_percent': round(cpu_percent, 1)
                    })
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue

        # Sort by memory usage descending
        processes.sort(key=lambda x: x['memory_mb'], reverse=True)

        # Group processes by name and sum memory and CPU
        process_groups = {}
        for proc in processes:
            name = proc['name']
            if name in process_groups:
                process_groups[name]['memory_mb'] += proc['memory_mb']
                process_groups[name]['cpu_percent'] += proc['cpu_percent']
                process_groups[name]['count'] += 1
            else:
                process_groups[name] = {
                    'name': name,
                    'memory_mb': proc['memory_mb'],
                    'cpu_percent': proc['cpu_percent'],
                    'count': 1
                }

        # Convert to list and sort by memory usage
        grouped_processes = list(process_groups.values())
        grouped_processes.sort(key=lambda x: x['memory_mb'], reverse=True)

        # Take top 10 processes for the apps list, aggregate the rest into "Others" for pie chart
        top_processes = grouped_processes[:10]
        others_memory = sum(proc['memory_mb'] for proc in grouped_processes[10:])
        others_cpu = sum(proc['cpu_percent'] for proc in grouped_processes[10:])

        if others_memory > 0:
            top_processes.append({
                'name': 'Others',
                'memory_mb': round(others_memory, 2),
                'cpu_percent': round(others_cpu, 1),
                'count': len(grouped_processes) - 10
            })

        # Calculate percentages
        total_memory = sum(proc['memory_mb'] for proc in top_processes)
        for proc in top_processes:
            proc['percentage'] = round((proc['memory_mb'] / total_memory) * 100, 1) if total_memory > 0 else 0

        return {
            'processes': top_processes,
            'total_memory_mb': round(total_memory, 2),
            'process_count': len(grouped_processes)
        }

    except Exception as e:
        return {
            'processes': [],
            'total_memory_mb': 0,
            'error': str(e)
        }
