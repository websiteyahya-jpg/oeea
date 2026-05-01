<?php
// Endpoint unique pour les formulaires Contact et Devis du site OEEA.
// Envoie les soumissions a contact@oeea.ma via mail() de PHP.

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method Not Allowed');
}

$to       = 'contact@oeea.ma';
$fromAddr = 'contact@oeea.ma';
$siteName = 'OEEA - Site Web';

function clean($v) {
    $v = is_string($v) ? trim($v) : '';
    return strip_tags($v);
}

$formType = clean($_POST['form_type'] ?? 'contact');

// --- Construction du contenu selon le type de formulaire ---
if ($formType === 'devis') {
    $firstname = clean($_POST['firstname'] ?? '');
    $lastname  = clean($_POST['lastname'] ?? '');
    $company   = clean($_POST['company'] ?? '');
    $role      = clean($_POST['role'] ?? '');
    $email     = clean($_POST['email'] ?? '');
    $phone     = clean($_POST['phone'] ?? '');
    $country   = clean($_POST['country'] ?? '');
    $service   = clean($_POST['service'] ?? '');
    $sector    = clean($_POST['sector'] ?? '');
    $desc      = clean($_POST['desc'] ?? '');
    $budget    = clean($_POST['budget'] ?? '');
    $deadline  = clean($_POST['deadline'] ?? '');
    $filenames = clean($_POST['filenames'] ?? '');

    if (!$firstname || !$lastname || !$company || !$email || !$service || !$sector || !$desc) {
        http_response_code(400);
        exit('Champs requis manquants');
    }

    $ref     = 'OEEA-' . strtoupper(substr(uniqid(), -6));
    $subject = "[Devis $ref] $company - $service";

    $bodyParts = [
        "Nouvelle demande de devis ($ref)",
        str_repeat('=', 60),
        '',
        '== Coordonnees ==',
        "Nom        : $firstname $lastname",
        "Entreprise : $company",
        "Fonction   : $role",
        "Email      : $email",
        "Telephone  : $phone",
        "Pays/Ville : $country",
        '',
        '== Projet ==',
        "Service    : $service",
        "Secteur    : $sector",
        "Budget     : $budget",
        "Echeance   : $deadline",
        '',
        '-- Description --',
        $desc,
        '',
        '-- Fichiers joints (a demander) --',
        $filenames !== '' ? $filenames : '(aucun)',
        '',
        str_repeat('=', 60),
        'Soumis depuis le site OEEA.',
    ];
    $body    = implode("\n", $bodyParts);
    $replyTo = $email;
    $redirect = 'merci.html';
} else {
    // Formulaire de contact
    $name    = clean($_POST['name'] ?? '');
    $email   = clean($_POST['email'] ?? '');
    $subj    = clean($_POST['subject'] ?? '');
    $message = clean($_POST['message'] ?? '');

    if (!$name || !$email || !$subj || !$message) {
        http_response_code(400);
        exit('Champs requis manquants');
    }

    $subject = "[Contact OEEA] $subj";
    $body    = "Nouveau message depuis le site OEEA\n"
             . str_repeat('=', 60) . "\n\n"
             . "Nom     : $name\n"
             . "Email   : $email\n"
             . "Sujet   : $subj\n\n"
             . "-- Message --\n"
             . $message . "\n\n"
             . str_repeat('=', 60) . "\n"
             . 'Soumis depuis le site OEEA.';
    $replyTo = $email;
    $redirect = 'merci.html';
}

// --- Envoi via mail() ---
$headers   = [];
$headers[] = "From: $siteName <$fromAddr>";
$headers[] = "Reply-To: $replyTo";
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'X-Mailer: PHP/' . phpversion();

$ok = @mail($to, $subject, $body, implode("\r\n", $headers));

// --- Reponse ---
$wantsJson = (
    (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false)
    || (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest')
);

if ($wantsJson) {
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['ok' => (bool)$ok, 'ref' => $ref ?? null]);
} else {
    if ($ok) {
        $url = $redirect;
        if (!empty($ref)) {
            $url .= '?ref=' . urlencode($ref);
        }
        header("Location: $url");
        exit;
    }
    http_response_code(500);
    echo 'Erreur lors de l\'envoi du message. Merci de reessayer ou nous contacter directement.';
}
