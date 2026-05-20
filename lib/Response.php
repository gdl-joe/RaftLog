<?php
declare(strict_types=1);

class Response
{
    public static function json(mixed $data, int $code = 200): never
    {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        exit;
    }

    public static function error(string $message, int $code = 400): never
    {
        self::json(['error' => $message], $code);
    }

    public static function notFound(string $message = 'Nicht gefunden'): never
    {
        self::error($message, 404);
    }

    public static function paginated(array $items, int $total, int $limit, int $offset): never
    {
        self::json([
            'items'   => $items,
            'total'   => $total,
            'limit'   => $limit,
            'offset'  => $offset,
            'hasMore' => ($offset + $limit) < $total,
        ]);
    }
}
