<?php

namespace Tests;

use SmoothyCloud\ApplicationTemplateValidator\Testing\Browser\Browser;
use SmoothyCloud\ApplicationTemplateValidator\Testing\TemplateTest;

class Test extends TemplateTest
{
    /** @test */
    public function the_syntax_of_the_template_is_correct()
    {
        $this->validateTemplate();
    }

    /** @test */
    public function the_application_works_correctly_when_deployed()
    {
        $this->deployApplication([
            'ghost_version' => 3,
            'ghost_url' => 'http://localhost:50000',
            'database_type' => 'sqlite3',
        ]);

        $browser = new Browser('http://localhost:50000');

        $browser->visit('/');
        $this->assertTrue($browser->pathIs('/'));
        $this->assertTrue($browser->see('Welcome to Ghost'));

        $browser->visit('/welcome');
        $this->assertTrue($browser->pathIs('/welcome/'));
        $this->assertTrue($browser->see('Welcome to Ghost'));
    }
}
