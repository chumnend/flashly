import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom'

import './ErrorPage.css'

const ErrorPage = () => {
    const error = useRouteError()

    let status = 404
    let message = "We couldn't find the page you were looking for."

    if (isRouteErrorResponse(error)) {
        status = error.status
        message = error.statusText || message
    } else if (error instanceof Error) {
        status = 500
        message = 'Something went wrong on our end.'
    }

    const is404 = status === 404

    return (
        <div className="error-page">
            <div className="error-page__grid" aria-hidden="true" />

            <div className="error-page__content">
                <div className="error-page__code" aria-hidden="true">
                    {status}
                </div>

                <h1 className="error-page__title">
                    {is404 ? 'Page not found.' : 'Something broke.'}
                </h1>

                <p className="error-page__message">{message}</p>

                <div className="error-page__actions">
                    <Link
                        to="/"
                        className="error-page__btn error-page__btn--primary"
                    >
                        Go home
                    </Link>
                    <Link
                        to="/explore"
                        className="error-page__btn error-page__btn--ghost"
                    >
                        Explore decks →
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default ErrorPage
