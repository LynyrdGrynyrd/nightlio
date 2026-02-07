from flask import Blueprint, request, jsonify
try:
    from api.utils.auth_middleware import require_auth, get_current_user_id
    from api.utils.responses import paginated_response, success_response
except ImportError:
    from utils.auth_middleware import require_auth, get_current_user_id
    from utils.responses import paginated_response, success_response


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
                pass  # Ignore invalid mood params

        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        # Pagination params
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        # Limit per_page to prevent abuse
        per_page = min(per_page, 100)

        result = mood_service.search_entries(
            user_id, query, moods, start_date, end_date, page, per_page
        )

        # Return paginated response
        return paginated_response(
            data=result["entries"],
            total=result["total"],
            page=page,
            per_page=per_page,
        )

    return bp
