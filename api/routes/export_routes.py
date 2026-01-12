from flask import Blueprint, make_response, jsonify, Response, request
from datetime import datetime
try:
    from api.utils.auth_middleware import require_auth, get_current_user_id
except ImportError:
    from utils.auth_middleware import require_auth, get_current_user_id

def create_export_routes(export_service):
    bp = Blueprint('export', __name__)

    @bp.route('/export/csv', methods=['GET'])
    @require_auth
    def export_csv():
        user_id = get_current_user_id()
        csv_data = export_service.generate_csv(user_id)
        
        output = make_response(csv_data)
        filename = f"twilightio_export_{datetime.now().strftime('%Y-%m-%d')}.csv"
        output.headers["Content-Disposition"] = f"attachment; filename={filename}"
        output.headers["Content-type"] = "text/csv"
        return output

    @bp.route('/export/json', methods=['GET'])
    @require_auth
    def export_json():
        user_id = get_current_user_id()
        json_data = export_service.generate_json(user_id)
        
        # Flask jsonify handles dict -> JSON string response
        response = jsonify(json_data)
        filename = f"twilightio_backup_{datetime.now().strftime('%Y-%m-%d')}.json"
        response.headers["Content-Disposition"] = f"attachment; filename={filename}"
        return response

    @bp.route('/export/import', methods=['POST'])
    @require_auth
    def import_data():
        user_id = get_current_user_id()
        if not request.is_json:
            return jsonify({"error": "Missing JSON body"}), 400
            
        data = request.get_json()
        stats = export_service.import_json(user_id, data)
        return jsonify({"message": "Import finished", "stats": stats})

    @bp.route('/export/pdf', methods=['GET'])
    @require_auth
    def export_pdf():
        user_id = get_current_user_id()
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        format_type = request.args.get('format', 'standard')  # 'standard' or 'therapist'
        
        pdf_bytes = export_service.generate_pdf(user_id, start_date, end_date, format_type)
        
        response = make_response(pdf_bytes)
        suffix = "_therapist" if format_type == "therapist" else ""
        filename = f"twilightio_report{suffix}_{datetime.now().strftime('%Y-%m-%d')}.pdf"
        response.headers["Content-Disposition"] = f"attachment; filename={filename}"
        response.headers["Content-Type"] = "application/pdf"
        return response

    return bp
