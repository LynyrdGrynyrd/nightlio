from flask import Blueprint, request, jsonify
try:
    from api.utils.auth_middleware import require_auth, get_current_user_id
except ImportError:
    from utils.auth_middleware import require_auth, get_current_user_id

def create_search_routes(mood_service):
    bp = Blueprint('search', __name__)

    @bp.route('/search', methods=['GET'])
    @require_auth
    def search_entries():
        user_id = get_current_user_id()
        query = request.args.get('q', '')
        
        # Parse moods "1,2,5" -> [1, 2, 5]
        moods_str = request.args.get('moods')
        moods = None
        if moods_str:
            try:
                moods = [int(m) for m in moods_str.split(',')]
            except ValueError:
                pass # Ignore invalid mood params

        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        # To prevent listing EVERYTHING when no filter is active, optionally require query or dates?
        # For now, let's allow it, but maybe limit logic belongs in DB.
        
        results = mood_service.search_entries(
            user_id, query, moods, start_date, end_date
        )
        return jsonify(results)

    return bp
