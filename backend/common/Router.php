
<?php
class Router {
    private $routes = [];
    
    public function addRoute($method, $path, $handler) {
        $this->routes[] = [
            'method' => strtoupper($method),
            'path' => $path,
            'handler' => $handler
        ];
    }
    
    public function get($path, $handler) {
        $this->addRoute('GET', $path, $handler);
    }
    
    public function post($path, $handler) {
        $this->addRoute('POST', $path, $handler);
    }
    
    public function put($path, $handler) {
        $this->addRoute('PUT', $path, $handler);
    }
    
    public function delete($path, $handler) {
        $this->addRoute('DELETE', $path, $handler);
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $path = str_replace('/api', '', $path); // Remove /api prefix
        
        foreach ($this->routes as $route) {
            if ($route['method'] === $method && $this->matchPath($route['path'], $path)) {
                $params = $this->extractParams($route['path'], $path);
                return call_user_func($route['handler'], $params);
            }
        }
        
        http_response_code(404);
        echo json_encode(['error' => 'Route not found']);
    }
    
    private function matchPath($routePath, $requestPath) {
        $routePattern = preg_replace('/\{[^}]+\}/', '([^/]+)', $routePath);
        return preg_match('#^' . $routePattern . '$#', $requestPath);
    }
    
    private function extractParams($routePath, $requestPath) {
        preg_match_all('/\{([^}]+)\}/', $routePath, $paramNames);
        $routePattern = preg_replace('/\{[^}]+\}/', '([^/]+)', $routePath);
        preg_match('#^' . $routePattern . '$#', $requestPath, $paramValues);
        
        $params = [];
        foreach ($paramNames[1] as $index => $name) {
            $params[$name] = $paramValues[$index + 1] ?? null;
        }
        
        return $params;
    }
}
