"""
Senseip Tool - API Endpoints
Provides job monitoring and management capabilities via RESTful endpoints.
"""

import subprocess
import json
from flask import Blueprint, jsonify, request

def register_apis(app, base_path):
    """Register senseip API endpoints"""

    @app.route(f'{base_path}/jobs', methods=['GET'])
    def get_jobs():
        """Get jobs data from SQL Server"""
        try:
            # Get maxResults parameter, default to 30 for backward compatibility
            max_results = request.args.get('maxResults', '30', type=int)
            
            # Validate maxResults range (10-300)
            if max_results < 10 or max_results > 300:
                max_results = 30
            
            # Get sort parameters
            sort_column = request.args.get('sortColumn', 'jobId')
            sort_direction = request.args.get('sortDirection', 'desc')
            
            # Validate sort column (only allow specific columns for security)
            allowed_columns = ['companyId', 'queueId', 'jobId', 'jobStatus', 'jobName', 'creationTimestamp', 'jobDetails']
            if sort_column not in allowed_columns:
                sort_column = 'jobId'
            
            # Validate sort direction
            if sort_direction not in ['asc', 'desc']:
                sort_direction = 'desc'
            
            # Execute the SQL command with pipe-separated output for easier parsing
            cmd = [
                'sqlcmd',
                '-S', '127.0.0.1,3333',
                '-U', 'sa',
                '-P', 'oOs2019!',
                '-d', 'global',
                '-s', '|',  # Use pipe as separator
                '-W',  # Remove trailing spaces
                '-Q', f"select top({max_results}) companyId, queueId, jobId, jobStatus, jobName, creationTimestamp, jobDetails from jobs order by {sort_column} {sort_direction}"
            ]

            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)

            if result.returncode != 0:
                return jsonify({
                    'success': False,
                    'error': f'SQL command failed: {result.stderr}'
                }), 500

                        # Parse the pipe-separated SQL output
            lines = result.stdout.strip().split('\n')
            if len(lines) < 2:  # Need at least header and one data row
                return jsonify({
                    'success': True,
                    'jobs': []
                })

            # Skip header line, then parse data
            jobs = []

            for line in lines[1:]:  # Start from index 1 to skip header
                if line.strip() and not line.startswith('-'):  # Skip separator lines
                    # Split by pipes
                    parts = line.split('|')
                    if len(parts) == 7:  # Exactly 7 fields expected
                        try:
                            job = {
                                'companyId': parts[0].strip(),
                                'queueId': parts[1].strip(),
                                'jobId': parts[2].strip(),
                                'jobStatus': parts[3].strip(),
                                'jobName': parts[4].strip(),
                                'creationTimestamp': parts[5].strip(),
                                'jobDetails': parts[6].strip()
                            }
                            jobs.append(job)
                        except (IndexError, ValueError) as e:
                            continue

            return jsonify({
                'success': True,
                'jobs': jobs
            })

        except subprocess.TimeoutExpired:
            return jsonify({
                'success': False,
                'error': 'SQL command timed out'
            }), 500
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Failed to execute SQL command: {str(e)}'
            }), 500

    @app.route(f'{base_path}/namespaces', methods=['GET'])
    def get_namespaces():
        """Get list of Kubernetes namespaces"""
        try:
            # Get namespaces
            cmd = ['kubectl', 'get', 'namespaces', '-o', 'jsonpath={.items[*].metadata.name}']
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                return jsonify({
                    'success': False,
                    'error': f'kubectl command failed: {result.stderr}'
                }), 500
            
            # Split the space-separated namespaces
            namespaces = result.stdout.strip().split()
            
            return jsonify({
                'success': True,
                'namespaces': namespaces
            })
            
        except subprocess.TimeoutExpired:
            return jsonify({
                'success': False,
                'error': 'kubectl command timed out'
            }), 500
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Failed to get namespaces: {str(e)}'
            }), 500

    @app.route(f'{base_path}/pods/<namespace>', methods=['GET'])
    def get_pods(namespace):
        """Get list of pods in a namespace"""
        try:
            # Get pods in namespace
            cmd = ['kubectl', 'get', 'pods', '-n', namespace, '-o', 'jsonpath={.items[*].metadata.name}']
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                return jsonify({
                    'success': False,
                    'error': f'kubectl command failed: {result.stderr}'
                }), 500
            
            # Split the space-separated pod names
            pods = result.stdout.strip().split()
            
            return jsonify({
                'success': True,
                'pods': pods
            })
            
        except subprocess.TimeoutExpired:
            return jsonify({
                'success': False,
                'error': 'kubectl command timed out'
            }), 500
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Failed to get pods: {str(e)}'
            }), 500

    @app.route(f'{base_path}/logs/<namespace>/<pod>', methods=['GET'])
    def get_pod_logs(namespace, pod):
        """Get logs from a specific pod"""
        try:
            # Get pod logs
            cmd = ['kubectl', 'logs', '-n', namespace, pod, '--tail=100']
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                return jsonify({
                    'success': False,
                    'error': f'kubectl logs command failed: {result.stderr}'
                }), 500
            
            logs = result.stdout
            
            return jsonify({
                'success': True,
                'logs': logs
            })
            
        except subprocess.TimeoutExpired:
            return jsonify({
                'success': False,
                'error': 'kubectl logs command timed out'
            }), 500
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Failed to get pod logs: {str(e)}'
            }), 500